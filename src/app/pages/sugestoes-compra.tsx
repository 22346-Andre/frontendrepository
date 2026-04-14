import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { ShoppingCart, TrendingUp, AlertCircle, Package, Download, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

interface Sugestao {
  produtoId: number;
  urgencia: string;
  nomeProduto: string;
  nomeFornecedor: string;
  telefoneFornecedor: string;
  quantidadeAtual: number;
  estoqueMinimo: number;
  quantidadeSugerida: number;
  valorUnitario: number;
  valorTotal: number;
}

export default function SugestoesCompra() {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarSugestoes();
  }, []);

  const carregarSugestoes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sugestoes-compra');
      setSugestoes(response.data);
    } catch (error) {
      toast.error("Erro ao carregar a lista de compras.");
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarPlanilha = async () => {
    try {
      toast.info("A gerar planilha...");
      const response = await api.get('/sugestoes-compra/planilha', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Planilha_de_Compras_SmartStock.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Planilha baixada com sucesso!");
    } catch (error) {
      toast.error("Erro ao baixar a planilha profissional.");
    }
  };

  const handleEnviarEmail = async () => {
    const email = window.prompt("Para qual e-mail deseja enviar a planilha completa?");
    if (!email) return;

    try {
      const loadingToast = toast.loading("A enviar e-mail com a planilha e resumo...");
      await api.post(`/sugestoes-compra/enviar-email?emailDestino=${email}`);
      toast.dismiss(loadingToast);
      toast.success("E-mail enviado com sucesso! Verifique a caixa de entrada.");
    } catch (error) {
      toast.dismiss();
      toast.error("Erro ao enviar o e-mail.");
    }
  };

  // 🚨 A MÁGICA DO WHATSAPP COM RESUMO INTELIGENTE AQUI
  const handlePedirFornecedor = (nomeFornecedor: string, telefone: string) => {
    if (!telefone) {
      toast.error(`O fornecedor ${nomeFornecedor} não tem telefone cadastrado!`);
      return;
    }

    // 1. Pega apenas os itens deste fornecedor
    const itensDoFornecedor = sugestoes.filter(s => s.nomeFornecedor === nomeFornecedor);

    // 2. Cria a Mini-Planilha em CSV na hora (só com as coisas dele)
    let csvContent = "PRODUTO;QTD_COMPRAR\n";
    itensDoFornecedor.forEach(item => {
      csvContent += `${item.nomeProduto};${item.quantidadeSugerida}\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Pedido_${nomeFornecedor.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click(); // Força o download
    link.parentNode?.removeChild(link);

    // 3. Monta o pequeno RESUMO para o texto (Limite de 5 itens para não quebrar o link)
    let resumo = "";
    const limite = 5;
    
    itensDoFornecedor.slice(0, limite).forEach(item => {
      resumo += `\n📦 ${item.quantidadeSugerida} un. de *${item.nomeProduto}*`;
    });

    // Se tiver mais de 5 itens, avisa que o resto está na planilha
    if (itensDoFornecedor.length > limite) {
      resumo += `\n*(...e mais ${itensDoFornecedor.length - limite} itens detalhados na planilha)*`;
    }

    // 4. Limpa o telefone e cria a mensagem para o WhatsApp
    const telLimpo = telefone.replace(/\D/g, '');
    const numWhatsApp = telLimpo.length <= 11 ? `55${telLimpo}` : telLimpo;
    
    const textoZap = `Olá, aqui é do setor de compras.\n\nGostaria de fazer o pedido de reposição das seguintes mercadorias:${resumo}\n\n*A planilha completa do pedido está em anexo.* Fico no aguardo do orçamento!`;
    const linkWhatsApp = `https://wa.me/${numWhatsApp}?text=${encodeURIComponent(textoZap)}`;

    // 5. Mostra o aviso e abre o WhatsApp
    toast.success("Mini-planilha baixada! Arraste ela para a conversa do WhatsApp que vai abrir.", { duration: 6000 });
    
    setTimeout(() => {
      window.open(linkWhatsApp, '_blank');
    }, 1500);
  };

  const totalSugestoes = sugestoes.length;
  const valorTotal = sugestoes.reduce((acc, curr) => acc + curr.valorTotal, 0);
  const urgentes = sugestoes.filter(s => s.urgencia === 'URGENTE').length;
  const atencao = sugestoes.filter(s => s.urgencia === 'ATENCAO').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sugestões de Compra</h1>
        <p className="text-gray-600">Sistema inteligente de reposição de estoque</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sugestões</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSugestoes}</div>
            <p className="text-xs text-gray-600">Produtos para comprar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
            </div>
            <p className="text-xs text-gray-600">Investimento necessário</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900">Urgentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentes}</div>
            <p className="text-xs text-red-800">Estoque zerado!</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">Atenção</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{atencao}</div>
            <p className="text-xs text-yellow-800">Abaixo do mínimo</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lista Inteligente de Compras</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Sugestões baseadas no estoque mínimo e margem de segurança</p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleEnviarEmail} variant="outline" disabled={sugestoes.length === 0}>
              <Mail className="mr-2 h-4 w-4" />
              E-mail Completo (Gestor)
            </Button>
            
            <Button onClick={handleBaixarPlanilha} disabled={sugestoes.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Baixar Planilha (Completa)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sugestoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Ótimo trabalho! Nenhum produto está com estoque crítico no momento.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Urgência</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Atual</TableHead>
                  <TableHead className="text-right text-blue-600">Comprar</TableHead>
                  <TableHead className="text-right">Total (R$)</TableHead>
                  <TableHead className="text-center">Ação (Fornecedor)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sugestoes.map((sugestao) => (
                  <TableRow key={sugestao.produtoId}>
                    <TableCell>
                      {sugestao.urgencia === 'URGENTE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="h-3 w-3" /> Urgente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Package className="h-3 w-3" /> Atenção
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{sugestao.nomeProduto}</TableCell>
                    
                    <TableCell className="text-gray-600">
                      {sugestao.nomeFornecedor}
                    </TableCell>

                    <TableCell className="text-right font-medium text-red-600">{sugestao.quantidadeAtual}</TableCell>
                    <TableCell className="text-right font-bold text-blue-600">{sugestao.quantidadeSugerida}</TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sugestao.valorTotal)}
                    </TableCell>

                    {/* 🚨 O BOTÃO DO WHATSAPP ESTÁ AQUI */}
                    <TableCell className="text-center">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title={`Pedir via WhatsApp para ${sugestao.nomeFornecedor}`}
                        onClick={() => handlePedirFornecedor(sugestao.nomeFornecedor, sugestao.telefoneFornecedor)}
                      >
                        <MessageCircle className="h-5 w-5" />
                      </Button>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}