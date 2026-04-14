import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Camera, Plus, Minus, UploadCloud, FileCode, Trash2, Barcode, FileUp, CheckCircle, Search, Clock, FileText, ShoppingCart, AlertTriangle, Printer, Info, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { produtoService, Produto } from '../services/produto.service';

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export default function ScannerPDV() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [inputBuscaFocado, setInputBuscaFocado] = useState(false);

  // CARRINHO
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  
  // SCANNER
  const [codigoBarras, setCodigoBarras] = useState('');
  const [scannerAtivo, setScannerAtivo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // HISTÓRICO
  const [historicoAgrupado, setHistoricoAgrupado] = useState<any[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  // XML
  const [file, setFile] = useState<File | null>(null);
  const [resultados, setResultados] = useState<any[]>([]);
  const [loadingXml, setLoadingXml] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ESTADOS DO MODAL DE PERDAS
  const [modalPerdaAberto, setModalPerdaAberto] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');

  useEffect(() => {
    carregarProdutos();
    carregarHistorico();
  }, []);

  const carregarProdutos = async () => {
    try {
      setProdutos(await produtoService.listarTodos());
    } catch (error) {
      toast.error('Erro ao carregar catálogo de produtos.');
    }
  };

  const carregarHistorico = async () => {
    setCarregandoHistorico(true);
    try {
      const res = await api.get('/movimentacoes');
      
      const agrupado = res.data.reduce((acc: any, mov: any) => {
        const isLoteValid = mov.chaveNotaFiscal && mov.chaveNotaFiscal.trim().length > 0;
        const chaveAgrupamento = isLoteValid ? mov.chaveNotaFiscal : `avulso-${new Date(mov.dataMovimentacao).getTime()}`; 
        
        if (!acc[chaveAgrupamento]) {
          acc[chaveAgrupamento] = { 
            chaveReal: isLoteValid ? mov.chaveNotaFiscal : mov.id.toString(), 
            chaveExibicao: chaveAgrupamento,
            data: mov.dataMovimentacao, 
            tipo: mov.tipo, 
            totalItens: 0, 
            valorTotal: 0, 
            nomes: [], 
            isLote: isLoteValid 
          };
        }
        
        acc[chaveAgrupamento].totalItens += mov.quantidade;
        acc[chaveAgrupamento].valorTotal += mov.quantidade * (mov.produto?.precoVenda || mov.produto?.precoCusto || 0);
        
        if (acc[chaveAgrupamento].nomes.length < 2 && !acc[chaveAgrupamento].nomes.includes(mov.produto?.nome)) {
          acc[chaveAgrupamento].nomes.push(mov.produto?.nome);
        }
        return acc;
      }, {});
      
      setHistoricoAgrupado(Object.values(agrupado).sort((a:any, b:any) => new Date(b.data).getTime() - new Date(a.data).getTime()));
    } catch (e) {
      console.error("Erro ao carregar histórico", e);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  useEffect(() => {
    if (inputRef.current && !scannerAtivo && !inputBuscaFocado && !modalPerdaAberto) inputRef.current.focus();
  }, [scannerAtivo, codigoBarras, inputBuscaFocado, modalPerdaAberto]);

  const processarCodigoLido = (codigo: string) => {
    const produtoEncontrado = produtos.find(p => p.codigoBarras === codigo);
    if (produtoEncontrado) {
      adicionarAoCarrinho(produtoEncontrado);
      toast.success(`${produtoEncontrado.nome} adicionado ao carrinho!`);
    } else {
      toast.error(`Código ${codigo} não encontrado!`);
    }
    setCodigoBarras(''); 
  };

  const adicionarAoCarrinho = (produto: Produto) => {
    setCarrinho(prev => {
      const existente = prev.find(item => item.produto.id === produto.id);
      if (existente) return prev.map(item => item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item);
      return [...prev, { produto, quantidade: 1 }];
    });
    setTermoBusca('');
  };

  const alterarQuantidade = (produtoId: number, novaQtd: number) => {
    if (novaQtd < 1) return;
    setCarrinho(prev => prev.map(item => item.produto.id === produtoId ? { ...item, quantidade: novaQtd } : item));
  };

  const removerDoCarrinho = (produtoId: number) => {
    setCarrinho(prev => prev.filter(item => item.produto.id !== produtoId));
  };

  const limparCarrinho = () => setCarrinho([]);

  const totalCarrinho = carrinho.reduce((acc, item) => acc + ((item.produto.precoVenda || item.produto.precoCusto || 0) * item.quantidade), 0);
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (scannerAtivo) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 150 } }, false);
      scanner.render((decodedText) => { setScannerAtivo(false); scanner?.clear(); processarCodigoLido(decodedText); }, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(() => {}); };
  }, [scannerAtivo, produtos]);

  const handleKeyDownPistola = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (codigoBarras.trim() === '') return;
      processarCodigoLido(codigoBarras.trim());
    }
  };

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(termoBusca.toLowerCase()) || 
    (p.codigoBarras && p.codigoBarras.includes(termoBusca))
  );

  const handleBaixarNF = async (grp: any, tipoFormato: 'danfe' | 'cupom') => {
    try {
      toast.loading(`A gerar ${tipoFormato === 'danfe' ? 'DANFE A4' : 'Cupom'}...`, { id: 'nf' });
      const urlPath = grp.isLote ? `/relatorios/${tipoFormato}/lote/${grp.chaveReal}/pdf` : `/relatorios/${tipoFormato}/${grp.chaveReal}/pdf`;
      const response = await api.get(urlPath, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', `${tipoFormato}_operacao_${grp.chaveReal}.pdf`); document.body.appendChild(link); link.click();
      toast.success("Impresso com sucesso!", { id: 'nf' });
    } catch (e) { toast.error("Erro na impressão. O ficheiro pode não existir.", { id: 'nf' }); }
  };

  const handleFinalizar = async (tipo: 'SAIDA' | 'ENTRADA') => {
    if (carrinho.length === 0) return;

    if (tipo === 'SAIDA') {
      for (const item of carrinho) {
        if (item.quantidade > item.produto.quantidade) {
          toast.error(`Estoque insuficiente para: ${item.produto.nome} (Saldo: ${item.produto.quantidade})`);
          return;
        }
      }
    }

    try {
      toast.loading(`A processar ${tipo === 'SAIDA' ? 'Venda' : 'Entrada'}...`, { id: 'op' });
      const chaveUnica = Array.from({length: 15}, () => Math.floor(Math.random() * 10)).join('');

      for (const item of carrinho) {
        if (tipo === 'SAIDA') {
          await produtoService.registrarSaida(item.produto.id, { 
            quantidadeDesejada: item.quantidade, 
            motivo: "Venda Caixa PDV",
            chaveNotaFiscal: chaveUnica 
          });
        } else {
          await api.post(`/produtos/${item.produto.id}/lotes`, { quantidade: item.quantidade, novoPrecoCompra: item.produto.precoCusto });
        }
      }

      toast.success("Operação concluída com sucesso!", { id: 'op' });
      setCarrinho([]);
      carregarProdutos();
      carregarHistorico();

      if (tipo === 'SAIDA') {
         const pseudoGrupo = { chaveReal: chaveUnica, isLote: true };
         handleBaixarNF(pseudoGrupo, 'cupom'); 
      }
    } catch (error: any) { toast.error(error.response?.data?.message || 'Erro ao finalizar a operação.', { id: 'op' }); }
  };

  const handleRegistrarPerda = async () => {
    if (carrinho.length === 0) return;
    if (!motivoPerda.trim()) {
      toast.error("É obrigatório informar o motivo da perda.");
      return;
    }
    
    for (const item of carrinho) {
      if (item.quantidade > item.produto.quantidade) return toast.error(`Estoque insuficiente para a perda: ${item.produto.nome}`);
    }

    try {
      toast.loading(`A registar perda no sistema...`, { id: 'perda' });
      const chaveUnica = Array.from({length: 15}, () => Math.floor(Math.random() * 10)).join('');

      for (const item of carrinho) {
        await produtoService.registrarSaida(item.produto.id, { 
          quantidadeDesejada: item.quantidade, 
          tipo: 'QUEBRA_PERDA', 
          motivo: motivoPerda,
          chaveNotaFiscal: chaveUnica 
        });
      }

      toast.success("Quebra/Perda registada com sucesso!", { id: 'perda' });
      setModalPerdaAberto(false);
      setMotivoPerda('');
      limparCarrinho();
      carregarProdutos();
      carregarHistorico();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao registar a perda.', { id: 'perda' });
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) validarEGuardarArquivo(e.dataTransfer.files[0]); };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) validarEGuardarArquivo(e.target.files[0]); };
  const validarEGuardarArquivo = (arquivo: File) => { if (!arquivo.name.toLowerCase().endsWith('.xml') && arquivo.type !== 'text/xml') return toast.error('Formato inválido! Envie .xml'); setFile(arquivo); setResultados([]); };
  
  const handleProcessarXML = async () => {
    if (!file) return;
    try {
      setLoadingXml(true);
      const formData = new FormData(); formData.append('file', file);
      const response = await api.post('/importacao/processar-xml', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      setResultados(response.data);
      toast.success("Nota Fiscal lida com precisão!");
    } catch (error: any) { toast.error("Erro de comunicação com o servidor."); } finally { setLoadingXml(false); }
  };

  const confirmarImportacao = async () => {
    try {
      const toastId = toast.loading("Aguarde... Atualizando estoque.");
      await api.post('/importacao/salvar', resultados);
      toast.dismiss(toastId);
      toast.success(`${resultados.length} produtos adicionados com sucesso!`);
      setResultados([]); setFile(null); carregarProdutos(); carregarHistorico();
    } catch (error: any) { toast.dismiss(); toast.error("Erro ao salvar no banco."); }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Caixa / PDV Aberto</h1>
        <p className="text-gray-600">Passe os produtos no leitor para adicionar ao carrinho.</p>
      </div>

      <Tabs defaultValue="pdv" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-6">
          <TabsTrigger value="pdv" className="gap-2"><ShoppingCart className="h-4 w-4" /> Frente de Caixa</TabsTrigger>
          <TabsTrigger value="xml" className="gap-2"><FileUp className="h-4 w-4" /> Importar NF-e</TabsTrigger>
          <TabsTrigger value="historico" className="gap-2"><Clock className="h-4 w-4" /> Histórico de Transações</TabsTrigger>
        </TabsList>

        <TabsContent value="pdv">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <Card className="lg:col-span-5 border-t-4 border-t-blue-600 shadow-md flex flex-col">
              <CardHeader className="pb-3 bg-muted border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Barcode className="h-5 w-5 text-blue-600" /> Leitor de Código
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex-1 flex flex-col">
                <input 
                  type="text" ref={inputRef} className="opacity-0 absolute w-0 h-0" 
                  value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} onKeyDown={handleKeyDownPistola}
                />
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder="Pesquisar por nome ou código..." className="pl-10 h-14 text-lg bg-card border-2 border-blue-100 focus-visible:ring-blue-500 rounded-xl"
                    value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} onFocus={() => setInputBuscaFocado(true)} onBlur={() => setInputBuscaFocado(false)}
                  />
                </div>

                {termoBusca ? (
                  <div className="border rounded-xl flex-1 overflow-y-auto bg-card shadow-inner p-2 max-h-[400px]">
                    {produtosFiltrados.length === 0 ? (
                      <p className="p-4 text-center text-muted-foreground">Nenhum produto encontrado.</p>
                    ) : (
                      produtosFiltrados.map((p) => (
                        <div key={p.id} onClick={() => adicionarAoCarrinho(p)} className="p-3 mb-2 border rounded-lg hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors">
                          <div>
                            <p className="font-bold text-foreground">{p.nome}</p>
                            <p className="text-xs font-mono text-muted-foreground">{p.codigoBarras || 'S/N'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">R$ {(p.precoVenda || p.precoCusto || 0).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Estoque: {p.quantidade}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted p-6">
                    {scannerAtivo ? (
                      <div id="reader" className="w-full"></div>
                    ) : (
                      <div className="text-center cursor-pointer" onClick={() => setScannerAtivo(true)}>
                        <div className="bg-card p-4 rounded-full shadow-sm inline-block mb-4"><Camera className="h-12 w-12 text-blue-500" /></div>
                        <h3 className="font-bold text-gray-700">Scanner da Câmera</h3>
                        <p className="text-sm text-muted-foreground mt-1">Toque para ativar a câmera.<br/>A pistola USB já está ativa.</p>
                      </div>
                    )}
                    {scannerAtivo && <Button variant="outline" className="mt-4 text-red-600" onClick={() => setScannerAtivo(false)}>Fechar Câmera</Button>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-7 shadow-lg border-border flex flex-col">
              <CardHeader className="bg-gray-800 text-white rounded-t-xl pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl flex items-center gap-2"><ShoppingCart className="h-6 w-6" /> Carrinho de Compras</CardTitle>
                  <span className="bg-gray-700 px-3 py-1 rounded-full text-xs font-mono">Caixa Livre</span>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col flex-1">
                
                <div className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto bg-yellow-50/30 p-2">
                  {carrinho.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                      <ShoppingCart className="h-20 w-20 mb-4" />
                      <p className="text-lg font-medium">O carrinho está vazio</p>
                      <p className="text-sm">Passe os produtos no leitor.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-transparent border-b-2 border-border">
                          <TableHead className="w-[10%]">Item</TableHead>
                          <TableHead className="w-[40%]">Produto</TableHead>
                          <TableHead className="text-center w-[20%]">Qtd</TableHead>
                          <TableHead className="text-right w-[20%]">Subtotal</TableHead>
                          <TableHead className="w-[10%]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {carrinho.map((item, index) => {
                          const preco = item.produto.precoVenda || item.produto.precoCusto || 0;
                          return (
                            <TableRow key={item.produto.id} className="border-b border-gray-100 bg-card">
                              <TableCell className="font-mono text-xs text-gray-400">{String(index + 1).padStart(3, '0')}</TableCell>
                              <TableCell className="font-bold text-gray-700">{item.produto.nome.substring(0, 25)}</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center border rounded-md overflow-hidden bg-muted">
                                  <button onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)} className="px-2 py-1 hover:bg-gray-200 text-gray-600">-</button>
                                  <span className="px-3 font-bold bg-card w-10 text-center">{item.quantidade}</span>
                                  <button onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)} className="px-2 py-1 hover:bg-gray-200 text-gray-600">+</button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold text-blue-700">R$ {(preco * item.quantidade).toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => removerDoCarrinho(item.produto.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>

                <div className="bg-muted border-t p-6 rounded-b-xl shadow-inner">
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-muted-foreground">
                      <p className="text-sm font-medium">Quantidade de Itens</p>
                      <p className="text-2xl font-bold text-gray-700">{totalItens}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground mb-1">TOTAL A PAGAR</p>
                      <p className="text-4xl font-black text-green-600 tracking-tight">R$ {totalCarrinho.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* 🟢 BOTÕES DE AÇÃO: Venda, Entrada e Perda na mesma grelha */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <Button variant="outline" className="h-14 border-blue-400 text-blue-700 hover:bg-blue-50" onClick={() => handleFinalizar('ENTRADA')} disabled={carrinho.length === 0}>
                      <Plus className="mr-2 h-4 w-4" /> Entrada Lote
                    </Button>
                    
                    <Button variant="outline" className="h-14 border-red-400 text-red-600 hover:bg-red-50" onClick={() => setModalPerdaAberto(true)} disabled={carrinho.length === 0}>
                      <AlertTriangle className="mr-2 h-4 w-4" /> Registar Perda
                    </Button>

                    <Button className="h-14 bg-green-500 hover:bg-green-600 text-white shadow-lg" onClick={() => handleFinalizar('SAIDA')} disabled={carrinho.length === 0}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Vender Caixa
                    </Button>
                  </div>
                  
                  {/* 🟢 BOTÃO "CANCELAR COMPRA" RESTAURADO AQUI EM BAIXO */}
                  <Button variant="ghost" className="w-full text-muted-foreground hover:bg-gray-200 hover:text-foreground" onClick={limparCarrinho} disabled={carrinho.length === 0}>
                    <XCircle className="w-4 h-4 mr-2" /> Cancelar Compra / Limpar Carrinho
                  </Button>

                </div>

              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações do Caixa</CardTitle>
              <CardDescription>Compras de múltiplos itens aparecem agrupadas no mesmo recibo.</CardDescription>
            </CardHeader>
            <CardContent>
              {carregandoHistorico ? (
                <div className="text-center py-8">A consultar a base de dados...</div>
              ) : historicoAgrupado.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted rounded-lg">Sem histórico de operações recente.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data da Transação</TableHead>
                      <TableHead>Resumo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Qtd. Total</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-center">Reimprimir Recibos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicoAgrupado.slice(0, 30).map(grp => (
                      <TableRow key={grp.chaveExibicao} className="hover:bg-muted">
                        <TableCell className="whitespace-nowrap font-medium text-gray-700">{format(new Date(grp.data), "dd/MM/yyyy HH:mm")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate" title={grp.nomes.join(', ')}>
                          {grp.nomes.join(', ')} {grp.totalItens > grp.nomes.length ? '...' : ''}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${grp.tipo === 'ENTRADA' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{grp.tipo}</span>
                        </TableCell>
                        <TableCell className="font-bold text-right text-gray-600">{grp.totalItens}</TableCell>
                        <TableCell className="font-bold text-right text-green-700">R$ {grp.valorTotal.toFixed(2)}</TableCell>
                        
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200" onClick={() => handleBaixarNF(grp, 'cupom')} title="Cupom da Impressora de Caixa">
                              <Printer className="h-4 w-4 mr-2" /> Cupom
                            </Button>
                            
                            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" onClick={() => handleBaixarNF(grp, 'danfe')} title="Nota Fiscal Formal A4">
                              <FileText className="h-4 w-4 mr-2" /> DANFE A4
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="xml">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-dashed border-gray-300 bg-muted/50">
              <CardHeader>
                <CardTitle>Enviar Documento Oficial</CardTitle>
                <CardDescription>Arraste o arquivo XML da Nota Fiscal (NF-e)</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-10">
                {!file ? (
                  <div className="w-full flex flex-col items-center cursor-pointer p-8" onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                    <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mb-6"><UploadCloud className="h-10 w-10 text-blue-600" /></div>
                    <h3 className="text-lg font-semibold text-gray-700">Clique ou arraste o seu XML</h3>
                    <p className="text-sm text-muted-foreground mt-2">Apenas ficheiros terminados em .xml</p>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center">
                    <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6"><FileCode className="h-10 w-10 text-green-600" /></div>
                    <h3 className="text-lg font-semibold text-gray-700 max-w-full truncate px-4">{file.name}</h3>
                    <div className="flex gap-4 mt-8 w-full px-8">
                      <Button variant="outline" className="flex-1 text-red-600" onClick={() => { setFile(null); setResultados([]); }}><Trash2 className="h-4 w-4 mr-2" /> Remover</Button>
                      <Button className="flex-1" onClick={handleProcessarXML} disabled={loadingXml}>{loadingXml ? "A processar..." : "Ler NF-e Oficial"}</Button>
                    </div>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept=".xml, text/xml, application/xml" onChange={handleFileInput} />
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800"><Info className="h-5 w-5" /> Dica para o Gestor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-amber-900">
                <p><strong>Por que usar o XML e não o PDF?</strong></p>
                <p className="text-sm">O arquivo XML é o padrão oficial da Receita Federal (SEFAZ). O XML contém os dados de forma <strong>100% estruturada e exata</strong>.</p>
                <p className="text-sm">Ao usar o XML, o sistema garante precisão absoluta na extração de <strong>nomes, códigos de barras e preços de custo</strong>.</p>
              </CardContent>
            </Card>
          </div>

          {resultados.length > 0 && (
            <Card className="mt-6 border-green-200 shadow-md">
              <CardHeader className="bg-green-50/50 border-b border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-green-800 flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Extração Perfeita</CardTitle>
                    <CardDescription>O sistema encontrou {resultados.length} produtos estruturados na Nota Fiscal.</CardDescription>
                  </div>
                  <Button onClick={confirmarImportacao} className="bg-green-600 hover:bg-green-700 shadow-sm">Confirmar e Salvar no Estoque</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Código de Barras</TableHead>
                      <TableHead>Produto Exato</TableHead>
                      <TableHead className="text-right">Custo Unit.</TableHead>
                      <TableHead className="text-right pr-6">Qtd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultados.map((prod, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-muted-foreground pl-6">{prod.codigoBarras}</TableCell>
                        <TableCell className="font-medium">{prod.nome}</TableCell>
                        <TableCell className="text-right text-gray-600">R$ {prod.precoCusto.toFixed(2)}</TableCell>
                        <TableCell className="text-right pr-6"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">+{prod.quantidade}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 🟢 MODAL DE REGISTO DE PERDAS/QUEBRAS */}
      <Dialog open={modalPerdaAberto} onOpenChange={setModalPerdaAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600"><AlertTriangle className="w-5 h-5 mr-2" /> Registar Quebra ou Perda</DialogTitle>
            <DialogDescription>
              Os {totalItens} produtos que estão no carrinho serão abatidos do stock como perda/quebra. 
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-2 font-medium">Motivo da Perda (Obrigatório para o Relatório)</p>
            <Input 
              placeholder="Ex: Produto passou da validade, Quebrou no transporte..." 
              value={motivoPerda}
              onChange={(e) => setMotivoPerda(e.target.value)}
              className="h-12"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setModalPerdaAberto(false)}>Cancelar</Button>
            <Button onClick={handleRegistrarPerda} className="bg-red-600 hover:bg-red-700 text-white">Confirmar Perda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}