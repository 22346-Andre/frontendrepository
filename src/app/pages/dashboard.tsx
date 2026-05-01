import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingUp, Package, AlertCircle, DollarSign, Lock, CheckCircle, PieChart, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { dashboardService } from '../services/dashboard.service';
import { produtoService, Produto } from '../services/produto.service';
import { toast } from 'sonner';
import api from '../services/api';

interface DashboardStats {
  capitalImobilizado: number;
  giroEstoque: number;
  totalProdutos: number;
  produtosCriticos: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    capitalImobilizado: 0, giroEstoque: 0, totalProdutos: 0, produtosCriticos: 0
  });
  
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState<Produto[]>([]);
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]); 
  const [loading, setLoading] = useState(true);
  const [acessoFinanceiroNegado, setAcessoFinanceiroNegado] = useState(false);
  
  //Estados para os dados REAIS do gráfico
  const [prejuizoTotal, setPrejuizoTotal] = useState(0);
  const [dadosGraficoPerdas, setDadosGraficoPerdas] = useState<{ mes: string; valor: number }[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);

    try {
      const resumo = await dashboardService.obterResumo();
      setStats(resumo);
    } catch (error: any) {
      if (error.response && (error.response.status === 400 || error.response.status === 403)) {
        setAcessoFinanceiroNegado(true); 
      } else {
        toast.error('Erro ao carregar estatísticas financeiras.');
      }
    }

    try {
      const listaProdutos = await produtoService.listarTodos();
      setTodosProdutos(listaProdutos);
    } catch (error) {}

    try {
      const produtosCriticos = await produtoService.listarCriticos();
      setProdutosBaixoEstoque(produtosCriticos);
    } catch (error) {}

    // 🟢 LÓGICA CORRIGIDA: Ler datas e somar por mês real
    try {
      const resMovs = await api.get('/movimentacoes'); 
      const perdas = resMovs.data.filter((m: any) => m.tipo === 'QUEBRA_PERDA');
      
      let totalAcumulado = 0;
      
      const perdasPorMes: { [key: string]: number } = {};
      const nomesMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

      const dataAtual = new Date();
      for (let i = 2; i >= 0; i--) {
        const mesIndex = new Date(dataAtual.getFullYear(), dataAtual.getMonth() - i, 1).getMonth();
        perdasPorMes[nomesMeses[mesIndex]] = 0;
      }

      perdas.forEach((p: any) => {
         const custo = p.produto?.precoCusto || 0;
         const valorPerdido = custo * p.quantidade;
         totalAcumulado += valorPerdido;

         if (p.dataMovimentacao) {
             const dataPerda = new Date(p.dataMovimentacao);
             const nomeDoMes = nomesMeses[dataPerda.getMonth()];
             
             if (perdasPorMes[nomeDoMes] !== undefined) {
                 perdasPorMes[nomeDoMes] += valorPerdido;
             } else {
                 perdasPorMes[nomeDoMes] = valorPerdido;
             }
         }
      });

      const chartData = Object.keys(perdasPorMes).map(mesKey => ({
          mes: mesKey,
          valor: perdasPorMes[mesKey]
      }));

      setPrejuizoTotal(totalAcumulado);
      setDadosGraficoPerdas(chartData);

    } catch (error) {
    }

    setLoading(false);
  };

  const formatarDadosGraficoABC = () => {
    if (todosProdutos.length === 0) return [];
    let totalA = 0, totalB = 0, totalC = 0;

    todosProdutos.forEach((p) => {
      const letra = p.classificacaoABC || '';
      if (letra === 'A') totalA++;
      if (letra === 'B') totalB++;
      if (letra === 'C') totalC++;
    });
    
    const totalGeral = totalA + totalB + totalC;
    if (totalGeral === 0) return [];

    return [
      { categoria: 'Classe A', porcentagem: Math.round((totalA / totalGeral) * 100), cor: '#10b981' },
      { categoria: 'Classe B', porcentagem: Math.round((totalB / totalGeral) * 100), cor: '#f59e0b' },
      { categoria: 'Classe C', porcentagem: Math.round((totalC / totalGeral) * 100), cor: '#ef4444' },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Calculando inteligência financeira...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Visão geral e inteligência do seu estoque</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-green-500 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {/* Alterado para dark:text-white */}
            <CardTitle className="text-sm font-bold text-gray-700 dark:text-white">Capital Imobilizado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            {acessoFinanceiroNegado ? (
              <div className="flex items-center text-gray-400 mt-2"><Lock className="h-5 w-5 mr-2" /><span className="text-sm font-medium">Acesso Restrito</span></div>
            ) : (
              <><div className="text-2xl font-black text-foreground dark:text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.capitalImobilizado)}</div><p className="text-xs text-muted-foreground dark:text-gray-400 font-medium mt-1">Valor total em prateleira</p></>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {/* Alterado para dark:text-white */}
            <CardTitle className="text-sm font-bold text-gray-700 dark:text-white">Giro de Estoque</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            {acessoFinanceiroNegado ? (
              <div className="flex items-center text-gray-400 mt-2"><Lock className="h-5 w-5 mr-2" /><span className="text-sm font-medium">Acesso Restrito</span></div>
            ) : (
              <><div className="text-2xl font-black text-foreground dark:text-white">{stats.giroEstoque}x</div><p className="text-xs text-muted-foreground dark:text-gray-400 font-medium mt-1">Giro nos últimos 30 dias</p></>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-purple-500 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {/* Alterado para dark:text-white */}
            <CardTitle className="text-sm font-bold text-gray-700 dark:text-white">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground dark:text-white">{stats.totalProdutos}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400 font-medium mt-1">Itens cadastrados</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-red-500 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {/* Alterado para dark:text-white */}
            <CardTitle className="text-sm font-bold text-gray-700 dark:text-white">Atenção Necessária</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-600 dark:text-red-400">{stats.produtosCriticos}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400 font-medium mt-1">Estoque crítico / baixo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <Card className="shadow-md border-t-4 border-t-indigo-500 lg:col-span-1 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 text-lg">
              <PieChart className="h-5 w-5" /> Curva ABC
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formatarDadosGraficoABC().length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={formatarDadosGraficoABC()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="categoria" fontSize={12} stroke="#9ca3af" />
                  <YAxis fontSize={12} stroke="#9ca3af" />
                  <Tooltip 
                    formatter={(value) => `${value}%`} 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} 
                  />
                  <Bar dataKey="porcentagem" radius={[4, 4, 0, 0]}>
                    {formatarDadosGraficoABC().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 bg-muted dark:bg-gray-900 rounded">Sem dados</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md border-t-4 border-t-red-500 lg:col-span-1 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-200 text-lg">
              <AlertTriangle className="h-5 w-5" /> Prejuízo por Perdas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {acessoFinanceiroNegado ? (
               <div className="flex items-center justify-center h-[220px] text-gray-400 bg-muted dark:bg-gray-900 rounded">Acesso Negado</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={dadosGraficoPerdas}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="mes" fontSize={12} stroke="#9ca3af" />
                    <Tooltip 
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`} 
                      cursor={{fill: 'rgba(255, 255, 255, 0.1)'}} 
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} 
                    />
                    <Bar dataKey="valor" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 text-center">
                  <span className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-widest font-bold">Total Acumulado</span>
                  <p className="text-xl font-black text-red-600 dark:text-red-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prejuizoTotal)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md border-t-4 border-t-orange-500 lg:col-span-1 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-orange-900 dark:text-orange-200 flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" /> Reposição Urgente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {produtosBaixoEstoque.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground dark:text-gray-400">
                  <CheckCircle className="h-10 w-10 text-green-500 dark:text-green-400 mb-2" />
                  <p className="font-bold text-green-700 dark:text-green-400">Tudo sob controle!</p>
                </div>
              ) : (
                produtosBaixoEstoque.map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-gray-700/50 border border-orange-200 dark:border-gray-600 rounded-lg">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-orange-900 dark:text-orange-100 truncate max-w-[150px]">{produto.nome}</p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Qtd: <span className="font-black text-red-600 dark:text-red-400">{produto.quantidade}</span></p>
                    </div>
                    <Link to={`/scanner`}>
                      <Button size="sm" variant="outline" className="border-orange-300 dark:border-orange-500 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 h-8">
                        Repor
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}