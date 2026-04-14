import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Mic, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export function VoiceCommandsHelp() {
  const comandos = [
    {
      categoria: 'Busca',
      exemplos: [
        'Buscar Arroz',
        'Procurar Feijão',
        'Encontrar Açúcar'
      ]
    },
    {
      categoria: 'Entrada de Estoque',
      exemplos: [
        'Dar entrada em 10 pacotes de Arroz',
        'Adicionar 5 unidades de Feijão',
        'Entrada de 20 kg de Açúcar'
      ]
    },
    {
      categoria: 'Saída de Estoque',
      exemplos: [
        'Dar saída de 3 unidades de Arroz',
        'Remover 2 pacotes de Feijão',
        'Vender 5 unidades de Açúcar'
      ]
    },
    {
      categoria: 'Navegação',
      exemplos: [
        'Ir para Dashboard',
        'Abrir Produtos',
        'Ir para Fornecedores',
        'Abrir Sugestões de Compra',
        'Ir para Relatórios',
        'Abrir Configurações',
        'Ir para Importação',
        'Abrir Scanner'
      ]
    },
    {
      categoria: 'Ajuda',
      exemplos: [
        'Ajuda',
        'Comandos disponíveis'
      ]
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        
        <button className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-card px-3 h-9 text-sm font-medium hover:bg-gray-100 gap-2 transition-colors shadow-sm">
          <Info className="h-4 w-4" />
          Comandos de Voz
        </button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Comandos de Voz Disponíveis
          </DialogTitle>
          <DialogDescription>
            Use o botão de microfone no header para ativar os comandos de voz
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {comandos.map((item) => (
            <div key={item.categoria}>
              <h3 className="font-semibold text-lg mb-3">{item.categoria}</h3>
              <div className="space-y-2">
                {item.exemplos.map((exemplo, index) => (
                  <div
                    key={index}
                    className="p-3 bg-muted rounded-lg border border-border flex items-center gap-3"
                  >
                    <Mic className="h-4 w-4 text-blue-600" />
                    <code className="text-sm font-mono">{exemplo}</code>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Dica de Uso</h4>
            <p className="text-sm text-blue-800">
              1. Clique no botão de microfone no header<br />
              2. Aguarde o toast "Escutando..." aparecer<br />
              3. Fale seu comando claramente<br />
              4. O sistema processará e executará a ação automaticamente
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-2">⚠️ Compatibilidade</h4>
            <p className="text-sm text-amber-800">
              Comandos de voz funcionam melhor no Google Chrome e Microsoft Edge.
              Certifique-se de permitir o acesso ao microfone quando solicitado.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}