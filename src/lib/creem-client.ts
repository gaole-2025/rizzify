/**
 * Creem 支付 API 客户端
 */

import axios, { AxiosInstance } from 'axios';

export interface CreemCheckoutPayload {
  product_id: string;
  request_id: string;
  success_url: string;
  cancel_url?: string;
  customer?: {
    email?: string;
  };
  metadata?: Record<string, any>;
}

export interface CreemCheckoutResponse {
  checkout_id: string;
  checkout_url: string;
  product_id: string;
  request_id: string;
  status: string;
  created_at: string;
}

export interface CreemOrderResponse {
  order_id: string;
  checkout_id: string;
  product_id: string;
  request_id: string;
  status: string;
  customer_id?: string;
  amount: number;
  currency: string;
  created_at: string;
  completed_at?: string;
}

class CreemClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl = 'https://api.creem.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 创建支付会话
   */
  async createCheckout(payload: CreemCheckoutPayload): Promise<CreemCheckoutResponse> {
    try {
      const response = await this.client.post<CreemCheckoutResponse>('/checkouts', payload);
      console.log('✅ Creem checkout created:', response.data.checkout_id);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create Creem checkout:', error.response?.data || error.message);
      throw new Error(`Creem checkout error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 查询订单详情
   */
  async getOrder(orderId: string): Promise<CreemOrderResponse> {
    try {
      const response = await this.client.get<CreemOrderResponse>(`/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get Creem order:', error.response?.data || error.message);
      throw new Error(`Creem order error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 查询 Checkout 详情
   */
  async getCheckout(checkoutId: string): Promise<CreemCheckoutResponse> {
    try {
      const response = await this.client.get<CreemCheckoutResponse>(`/checkouts/${checkoutId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get Creem checkout:', error.response?.data || error.message);
      throw new Error(`Creem checkout error: ${error.response?.data?.message || error.message}`);
    }
  }
}

// 单例
let creemClient: CreemClient | null = null;

export function getCreemClient(): CreemClient {
  if (!creemClient) {
    const apiKey = process.env.CREEM_API_KEY;
    if (!apiKey) {
      throw new Error('CREEM_API_KEY is not set');
    }
    creemClient = new CreemClient(apiKey);
  }
  return creemClient;
}
