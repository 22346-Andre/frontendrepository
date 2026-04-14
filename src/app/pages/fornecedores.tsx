import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
}

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  
  const [searchParams] = useSearchParams();
  const [busca, setBusca] = useState(searchParams.get('q') || '');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoFornecedor, setNovoFornecedor] = useState({ nome: '', cnpj: '', telefone: '', email: '' });

  const [dialogEditOpen, setDialogEditOpen] = useState(false);
  const [fornecedorEditando, setFornecedorEditando] = useState<Fornecedor | null>(null);

  useEffect(() => {
    const queryVoz = searchParams.get('q');
    if (queryVoz !== null) {
      setBusca(queryVoz);
    }
  }, [searchParams]);

  useEffect(() => {
    carregarFornecedores();
  }, []);

  const carregarFornecedores = async () => {
    try {
      const response = await api.get('/fornecedores');
      setFornecedores(response.data);
    } catch (error) {
      toast.error('Erro ao carregar a lista de fornecedores.');
    }
  };

  const handleAdicionarFornecedor = async () => {
    try {
      await api.post('/fornecedores', novoFornecedor);
      toast.success('Fornecedor adicionado com sucesso!');
      setDialogOpen(false);
      setNovoFornecedor({ nome: '', cnpj: '', telefone: '', email: '' });
      carregarFornecedores(); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao adicionar fornecedor.');
    }
  };

  const handleSalvarEdicao = async () => {
    if (!fornecedorEditando) return;
    try {
      await api.put(`/fornecedores/${fornecedorEditando.id}`, fornecedorEditando);
      toast.success('Fornecedor atualizado com sucesso!');
      setDialogEditOpen(false);
      carregarFornecedores(); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar fornecedor.');
    }
  };

  const handleExcluirFornecedor = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja apagar este fornecedor?")) return;
    try {
      await api.delete(`/fornecedores/${id}`);
      toast.success('Fornecedor excluído com sucesso!');
      carregarFornecedores(); 
    } catch (error) {
      toast.error('Erro ao excluir fornecedor.');
    }
  };

  const fornecedoresFiltrados = fornecedores.filter((fornecedor) =>
    fornecedor.nome.toLowerCase().includes(busca.toLowerCase()) ||
    fornecedor.cnpj.includes(busca)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Fornecedores</h1>
          <p className="text-gray-600">Gerencie seus fornecedores e parceiros</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <div className="inline-block">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Fornecedor</DialogTitle>
              <DialogDescription>Preencha as informações do fornecedor abaixo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Fornecedor</Label>
                <Input value={novoFornecedor.nome} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input placeholder="00.000.000/0000-00" value={novoFornecedor.cnpj} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, cnpj: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input placeholder="(11) 98765-4321" value={novoFornecedor.telefone} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, telefone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" placeholder="contato@fornecedor.com" value={novoFornecedor.email} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, email: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleAdicionarFornecedor}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogEditOpen} onOpenChange={setDialogEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Fornecedor</DialogTitle>
              <DialogDescription>Atualize os dados do fornecedor abaixo.</DialogDescription>
            </DialogHeader>
            {fornecedorEditando && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={fornecedorEditando.nome} onChange={(e) => setFornecedorEditando({ ...fornecedorEditando, nome: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={fornecedorEditando.cnpj} onChange={(e) => setFornecedorEditando({ ...fornecedorEditando, cnpj: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={fornecedorEditando.telefone} onChange={(e) => setFornecedorEditando({ ...fornecedorEditando, telefone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={fornecedorEditando.email} onChange={(e) => setFornecedorEditando({ ...fornecedorEditando, email: e.target.value })} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogEditOpen(false)}>Cancelar</Button>
              <Button onClick={handleSalvarEdicao}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar por nome ou CNPJ..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fornecedoresFiltrados.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum fornecedor encontrado.</TableCell></TableRow>
              ) : (
                fornecedoresFiltrados.map((fornecedor) => (
                  <TableRow key={fornecedor.id}>
                    <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                    <TableCell className="text-gray-600">{fornecedor.cnpj}</TableCell>
                    <TableCell className="text-gray-600">{fornecedor.telefone}</TableCell>
                    <TableCell className="text-gray-600">{fornecedor.email}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setFornecedorEditando(fornecedor); setDialogEditOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleExcluirFornecedor(fornecedor.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}