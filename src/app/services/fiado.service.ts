import api from './api';

export interface ContaReceber {
  id: number;
  nomeCliente: string;
  telefoneCliente: string;
  valor: number;
  descricao: string;
  dataCompra: string;
  dataVencimento: string;
  dataProximaCobranca: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
}

export interface ContaReceberDTO {
  nomeCliente: string;
  telefoneCliente: string;
  valor: number;
  descricao: string;
  dataVencimento: string;
  dataProximaCobranca?: string; // Opcional (se vazio o backend põe 14 dias)
}

export const fiadoService = {
  // Regista uma nova dívida na caderneta
  async registrarFiado(dados: ContaReceberDTO): Promise<ContaReceber> {
    const response = await api.post('/fiados', dados);
    return response.data;
  },

  // Traz a lista de todo o mundo que deve
  async listarCaderneta(): Promise<ContaReceber[]> {
    const response = await api.get('/fiados');
    return response.data;
  },

  // Traz APENAS quem já está na data de ser cobrado
  async listarSugestoesCobranca(): Promise<ContaReceber[]> {
    const response = await api.get('/fiados/sugestoes-cobranca');
    return response.data;
  },

  // Pede ao backend o link mágico do WhatsApp codificado
  async obterLinkWhatsApp(id: number): Promise<string> {
    const response = await api.get(`/fiados/${id}/whatsapp`);
    return response.data.linkWhatsApp; // Vem do Map.of("linkWhatsApp", link) do Java
  },

  // Marca que o cliente já pagou tudo
  async marcarComoPago(id: number): Promise<ContaReceber> {
    const response = await api.put(`/fiados/${id}/pagar`);
    return response.data;
  },

  // O cliente pediu "dá-me mais 5 dias". Isto adia a próxima cobrança.
  async adiarCobranca(id: number, dias: number): Promise<ContaReceber> {
    const response = await api.put(`/fiados/${id}/adiar?dias=${dias}`);
    return response.data;
  }
};