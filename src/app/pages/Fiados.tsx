import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { MessageCircle, CheckCircle, Clock, Search, PlusCircle, AlertCircle, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fiadoService, ContaReceber } from '../services/fiado.service';

export default function Fiados() {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [sugestoes, setSugestoes] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');

  // Estados do Modal de Novo Fiado
  const [modalAberto, setModalAberto] = useState(false);
  const [novoCliente, setNovoCliente] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaDataVencimento, setNovaDataVencimento] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [todas, paraCobrar] = await Promise.all([
        fiadoService.listarCaderneta(),
        fiadoService.listarSugestoesCobranca()
      ]);
      setContas(todas);
      setSugestoes(paraCobrar);
    } catch (e) {
      toast.error('Erro ao carregar a caderneta.');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarFiado = async () => {
    if (!novoCliente || !novoTelefone || !novoValor || !novaDataVencimento) {
      return toast.error("Preencha os campos obrigatórios (Nome, Telefone, Valor, Vencimento)");
    }

    try {
      toast.loading("A registar fiado...", { id: 'fiado' });
      await fiadoService.registrarFiado({
        nomeCliente: novoCliente,
        telefoneCliente: novoTelefone.replace(/\D/g, ''),
        valor: parseFloat(novoValor),
        descricao: novaDescricao || 'Compras diversas',
        dataVencimento: novaDataVencimento,
      });
      toast.success("Adicionado à Caderneta com sucesso!", { id: 'fiado' });
      setModalAberto(false);
      setNovoCliente(''); setNovoTelefone(''); setNovoValor(''); setNovaDescricao(''); setNovaDataVencimento('');
      carregarDados();
    } catch (e) {
      toast.error("Erro ao salvar", { id: 'fiado' });
    }
  };

  const handleCobrarWhatsApp = async (contaId: number) => {
    try {
      const link = await fiadoService.obterLinkWhatsApp(contaId);
      window.open(link, '_blank');
      toast.success("WhatsApp aberto! Envie a mensagem ao cliente.");
    } catch (e) {
      toast.error("Erro ao gerar link de cobrança.");
    }
  };

  const handleMarcarPago = async (contaId: number) => {
    try {
      await fiadoService.marcarComoPago(contaId);
      toast.success("Boa! Conta marcada como paga.");
      carregarDados();
    } catch (e) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleAdiarCobranca = async (contaId: number, dias: number) => {
    try {
      await fiadoService.adiarCobranca(contaId, dias);
      toast.success(`Lembrete adiado em ${dias} dias.`);
      carregarDados();
    } catch (e) {
      toast.error("Erro ao adiar cobrança.");
    }
  };

  const formatarData = (dataString: string) => {
    return format(parseISO(dataString), "dd 'de' MMM, yyyy", { locale: ptBR });
  };

  const contasFiltradas = contas.filter(c => c.nomeCliente.toLowerCase().includes(termoBusca.toLowerCase()));

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Caderneta / Fiado</h1>
          <p className="text-muted-foreground">Gira quem lhe deve e faça cobranças automáticas pelo WhatsApp.</p>
        </div>
        <Button onClick={() => setModalAberto(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="w-5 h-5 mr-2" /> Novo Fiado
        </Button>
      </div>

      <Tabs defaultValue="sugestoes" className="w-full">
        <TabsList className="mb-6 bg-card border shadow-sm">
          <TabsTrigger value="sugestoes" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
            <AlertCircle className="w-4 h-4 mr-2" /> Para Cobrar Hoje ({sugestoes.length})
          </TabsTrigger>
          <TabsTrigger value="todas">
            <Clock className="w-4 h-4 mr-2" /> Caderneta Completa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sugestoes">
          <Card className="border-orange-200 shadow-md">
            <CardHeader className="bg-orange-50/50 border-b border-orange-100">
              <CardTitle className="text-orange-800 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" /> Chegou a hora de cobrar!
              </CardTitle>
              <CardDescription>Estes clientes já chegaram à data combinada de lembrete (ou estão atrasados).</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? <p>A carregar...</p> : sugestoes.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-300 mb-3" />
                  <p className="text-lg font-medium text-gray-700">Tudo limpo!</p>
                  <p>Não há clientes para cobrar hoje.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sugestoes.map(conta => (
                    <Card key={conta.id} className="border border-border overflow-hidden hover:shadow-md transition-shadow">
                      <div className={`h-2 w-full ${conta.status === 'ATRASADO' ? 'bg-red-500' : 'bg-orange-400'}`}></div>
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-foreground">{conta.nomeCliente}</h3>
                            <p className="text-sm text-muted-foreground">{conta.descricao}</p>
                          </div>
                          <span className="font-black text-xl text-red-600">R$ {conta.valor.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-4 bg-muted p-2 rounded">
                          <p>Venceu em: <strong>{formatarData(conta.dataVencimento)}</strong></p>
                        </div>
                        
                        <div className="space-y-2">
                          <Button onClick={() => handleCobrarWhatsApp(conta.id)} className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white">
                            <MessageCircle className="w-4 h-4 mr-2" /> Cobrar no WhatsApp
                          </Button>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={() => handleAdiarCobranca(conta.id, 5)} className="text-gray-600 text-xs">
                              <CalendarClock className="w-3 h-3 mr-1" /> Pediu +5 dias
                            </Button>
                            <Button variant="outline" onClick={() => handleMarcarPago(conta.id)} className="text-green-600 border-green-200 hover:bg-green-50 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" /> Recebi
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="todas">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Todos os Registos</CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Procurar cliente..." className="pl-9" value={termoBusca} onChange={e => setTermoBusca(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Resumo</TableHead>
                    <TableHead>Próximo Lembrete</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasFiltradas.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum registo encontrado.</TableCell></TableRow>
                  ) : (
                    contasFiltradas.map(conta => (
                      <TableRow key={conta.id} className={conta.status === 'PAGO' ? 'opacity-60 bg-muted' : ''}>
                        <TableCell className="font-medium">{conta.nomeCliente}<br/><span className="text-xs text-gray-400">{conta.telefoneCliente}</span></TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{conta.descricao}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {conta.status === 'PAGO' ? '-' : formatarData(conta.dataProximaCobranca)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold 
                            ${conta.status === 'PAGO' ? 'bg-green-100 text-green-700' : 
                              conta.status === 'ATRASADO' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                            {conta.status}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-bold ${conta.status === 'PAGO' ? 'text-green-600 line-through' : 'text-red-600'}`}>
                          R$ {conta.valor.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anotar na Caderneta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nome do Cliente</label>
              <Input placeholder="Ex: Sr. João da Padaria" value={novoCliente} onChange={e => setNovoCliente(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">WhatsApp do Cliente (Apenas números)</label>
              <Input placeholder="Ex: 11988887777" type="tel" value={novoTelefone} onChange={e => setNovoTelefone(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Valor Total (R$)</label>
              <Input placeholder="Ex: 150.50" type="number" step="0.01" value={novoValor} onChange={e => setNovoValor(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Resumo da Compra</label>
              <Input placeholder="Ex: Fardo de Coca-Cola e Salgados" value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Data Combinada para Pagamento</label>
              <Input type="date" value={novaDataVencimento} onChange={e => setNovaDataVencimento(e.target.value)} />
              <p className="text-xs text-muted-foregroundmt-1">O sistema vai lembrar de cobrar automaticamente 14 dias após esta data.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button onClick={handleSalvarFiado} className="bg-blue-600 hover:bg-blue-700 text-white">Salvar na Caderneta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}