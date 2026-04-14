import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Building2, Users, Plus, Edit, Trash2, Mail, Shield, Package, ShoppingCart, Crown } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';
import { toast } from 'sonner';
import api from '../services/api';

interface Funcionario { id: number; nome: string; email: string; perfil: string; }

export default function Configuracoes() {
  const { user } = useAuth();
  const [empresaData, setEmpresaData] = useState({ cnpj: '', razaoSocial: '', nomeFantasia: '', email: '', celular: '', endereco: '', cidade: '', estado: '' });
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', email: '', senha: '', perfil: 'CAIXA' });
  const [dialogEditFuncOpen, setDialogEditFuncOpen] = useState(false);
  const [funcionarioEditando, setFuncionarioEditando] = useState<Funcionario | null>(null);

  useEffect(() => {
    carregarEmpresa();
    carregarEquipe();
  }, []);

  const carregarEmpresa = async () => {
    try {
      const response = await api.get('/empresas/minha-empresa');
      setEmpresaData({
        cnpj: response.data.cnpj || '', razaoSocial: response.data.razaoSocial || '',
        nomeFantasia: response.data.nomeFantasia || '', email: response.data.emailContato || '',
        celular: response.data.telefone || '', endereco: response.data.endereco || '',
        cidade: response.data.cidade || '', estado: response.data.estado || ''
      });
    } catch (error) { toast.error('Não foi possível carregar os dados da empresa.'); }
  };

  const handleSalvarEmpresa = async () => {
    try {
      const dados = {
        razaoSocial: empresaData.razaoSocial, nomeFantasia: empresaData.nomeFantasia, emailContato: empresaData.email,
        telefone: empresaData.celular, endereco: empresaData.endereco, cidade: empresaData.cidade, estado: empresaData.estado
      };
      await api.put('/empresas/minha-empresa', dados);
      toast.success('Dados da empresa atualizados com sucesso!');
    } catch (error) { toast.error('Erro ao atualizar empresa.'); }
  };

  const carregarEquipe = async () => {
    try {
      const response = await api.get('/usuarios');
      setFuncionarios(response.data);
    } catch (error: any) {
      if (error.response && (error.response.status === 400 || error.response.status === 403)) { 
        console.log("Acesso restrito."); 
      }
    }
  };

  const handleAdicionarFuncionario = async () => {
    try {
      await api.post('/usuarios', novoFuncionario);
      toast.success('Funcionário adicionado com sucesso!');
      setDialogOpen(false);
      setNovoFuncionario({ nome: '', email: '', senha: '', perfil: 'CAIXA' }); 
      carregarEquipe(); 
    } catch (error: any) { 
      toast.error(error.response?.data?.message || 'Erro ao adicionar funcionário.'); 
    }
  };

  const handleSalvarEdicaoFuncionario = async () => {
    if (!funcionarioEditando) return;
    try {
      await api.put(`/usuarios/${funcionarioEditando.id}`, {
        nome: funcionarioEditando.nome,
        email: funcionarioEditando.email,
        perfil: funcionarioEditando.perfil
      });
      toast.success('Perfil atualizado com sucesso!');
      setDialogEditFuncOpen(false);
      carregarEquipe(); 
    } catch (error: any) { 
      toast.error(error.response?.data?.message || 'Erro ao atualizar funcionário.'); 
    }
  };

  const handleRemoverFuncionario = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja apagar este funcionário?")) return;
    try {
      await api.delete(`/usuarios/${id}`);
      toast.success('Funcionário removido com sucesso!');
      carregarEquipe(); 
    } catch (error: any) { 
      toast.error(error.response?.data?.message || 'Erro ao remover funcionário.'); 
    }
  };

  const formatarCargoVisual = (perfil: string) => {
    if (perfil === 'ADMIN' || perfil === 'SUPER_ADMIN') return 'Gerente / Admin';
    if (perfil === 'ESTOQUISTA') return 'Estoquista';
    if (perfil === 'CAIXA') return 'Caixa';
    return perfil;
  };

  const renderIconeCargo = (perfil: string) => {
    if (perfil === 'ADMIN' || perfil === 'SUPER_ADMIN') return <Shield className="h-4 w-4 text-blue-600" />;
    if (perfil === 'ESTOQUISTA') return <Package className="h-4 w-4 text-orange-500" />;
    if (perfil === 'CAIXA') return <ShoppingCart className="h-4 w-4 text-green-500" />;
    return <Users className="h-4 w-4 text-gray-400" />;
  };

  // 🚨 A MÁGICA DE LÓGICA AQUI: O funcionário com o menor ID é o Dono da empresa!
  const donoDaLojaId = funcionarios.length > 0 ? Math.min(...funcionarios.map(f => f.id)) : -1;

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Configurações e Equipe</h1><p className="text-gray-600">Gerencie os dados da empresa e sua equipe</p></div>

      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="empresa" className="gap-2"><Building2 className="h-4 w-4" /> Empresa</TabsTrigger>
          <TabsTrigger value="equipe" className="gap-2"><Users className="h-4 w-4" /> Equipe</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Dados da Empresa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>CNPJ</Label><Input value={empresaData.cnpj} disabled className="bg-muted text-muted-foreground cursor-not-allowed" /></div>
                <div className="space-y-2"><Label>Razão Social</Label><Input value={empresaData.razaoSocial} onChange={e => setEmpresaData({ ...empresaData, razaoSocial: e.target.value })} /></div>
                <div className="space-y-2"><Label>Nome Fantasia</Label><Input value={empresaData.nomeFantasia} onChange={e => setEmpresaData({ ...empresaData, nomeFantasia: e.target.value })} /></div>
                <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={empresaData.email} onChange={e => setEmpresaData({ ...empresaData, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Celular</Label><Input value={empresaData.celular} onChange={e => setEmpresaData({ ...empresaData, celular: e.target.value })} /></div>
                <div className="space-y-2"><Label>Endereço</Label><Input value={empresaData.endereco} onChange={e => setEmpresaData({ ...empresaData, endereco: e.target.value })} /></div>
                <div className="space-y-2"><Label>Cidade</Label><Input value={empresaData.cidade} onChange={e => setEmpresaData({ ...empresaData, cidade: e.target.value })} /></div>
                <div className="space-y-2"><Label>Estado</Label><Input value={empresaData.estado} onChange={e => setEmpresaData({ ...empresaData, estado: e.target.value })} maxLength={2} /></div>
              </div>
              <div className="flex justify-end pt-4"><Button onClick={handleSalvarEmpresa}>Salvar Alterações</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipe" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Gestão de Equipe</CardTitle><p className="text-sm text-gray-600 mt-1">Adicione funcionários e gerencie permissões</p></div>
              <Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Novo</Button>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Adicionar Funcionário</DialogTitle><DialogDescription className="hidden">Janela para adicionar funcionário</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Nome</Label><Input value={novoFuncionario.nome} onChange={e => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })} /></div>
                    <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={novoFuncionario.email} onChange={e => setNovoFuncionario({ ...novoFuncionario, email: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Senha</Label><Input type="password" value={novoFuncionario.senha} onChange={e => setNovoFuncionario({ ...novoFuncionario, senha: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>Função</Label>
                      <select className="w-full p-2 border rounded-md" value={novoFuncionario.perfil} onChange={e => setNovoFuncionario({ ...novoFuncionario, perfil: e.target.value })}>
                        <option value="CAIXA">Caixa</option>
                        <option value="ESTOQUISTA">Estoquista</option>
                        <option value="ADMIN">Gerente (Admin)</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleAdicionarFuncionario}>Adicionar</Button></DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={dialogEditFuncOpen} onOpenChange={setDialogEditFuncOpen}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Editar Funcionário (RH)</DialogTitle><DialogDescription className="hidden">Janela para editar perfil.</DialogDescription></DialogHeader>
                  {funcionarioEditando && (
                    <div className="space-y-4 py-4">
                      <div className="space-y-2"><Label>Nome</Label><Input value={funcionarioEditando.nome} onChange={(e) => setFuncionarioEditando({ ...funcionarioEditando, nome: e.target.value })} /></div>
                      <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={funcionarioEditando.email} onChange={(e) => setFuncionarioEditando({ ...funcionarioEditando, email: e.target.value })} /></div>
                      <div className="space-y-2">
                        <Label>Nova Função (Perfil)</Label>
                        <select className="w-full p-2 border rounded-md" value={funcionarioEditando.perfil} onChange={(e) => setFuncionarioEditando({ ...funcionarioEditando, perfil: e.target.value })}>
                          <option value="CAIXA">Caixa</option>
                          <option value="ESTOQUISTA">Estoquista</option>
                          <option value="ADMIN">Gerente (Admin)</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <DialogFooter><Button variant="outline" onClick={() => setDialogEditFuncOpen(false)}>Cancelar</Button><Button onClick={handleSalvarEdicaoFuncionario}>Salvar Alterações</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Função</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {funcionarios.map(func => (
                    <TableRow key={func.id}>
                      <TableCell className="font-medium">{func.nome}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" />{func.email}</div></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {renderIconeCargo(func.perfil)}
                          <span className={func.perfil === 'ADMIN' ? 'font-semibold text-blue-700' : 'text-gray-700'}>
                            {formatarCargoVisual(func.perfil)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        
                        {/* 🚨 NOVA REGRA APLICADA: Bloqueia APENAS o Dono (donoDaLojaId) */}
                        {func.id === donoDaLojaId ? (
                          <div className="flex justify-end pr-4 text-gray-400 cursor-default" title="A conta do Dono é protegida e inalterável">
                             <Crown className="h-4 w-4 text-amber-500 opacity-80" />
                             <span className="text-[10px] ml-1 font-bold text-amber-600 uppercase tracking-tighter">Dono</span>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setFuncionarioEditando(func); setDialogEditFuncOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRemoverFuncionario(func.id)} className="text-red-600 hover:bg-red-50" title="Demitir / Excluir">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}