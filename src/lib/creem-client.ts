/**
 * Creem 支付 API 客户端
 */

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
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // 根据 API 密钥前缀判断环境
    if (apiKey.startsWith('creem_test_')) {
      this.baseUrl = 'https://test-api.creem.io/v1';
    } else {
      this.baseUrl = 'https://api.creem.io/v1';
    }
    console.log(`🔧 Creem client initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * 创建支付会话
   */
  async createCheckout(payload: CreemCheckoutPayload): Promise<CreemCheckoutResponse> {
    try {
      console.log('🔄 Creating Creem checkout with payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`${this.baseUrl}/checkouts`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log(`📊 Creem API response status: ${response.status}`);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
        console.error('❌ Creem API error response:', JSON.stringify(errorData, null, 2));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Creem checkout created:', data.checkout_id);
      return data;
    } catch (error: any) {
      console.error('❌ Failed to create Creem checkout:', error.message);
      throw new Error(`Creem checkout error: ${error.message}`);
    }
  }

  /**
   * 查询订单详情
   */
  async getOrder(orderId: string): Promise<CreemOrderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Failed to get Creem order:', error.message);
      throw new Error(`Creem order error: ${error.message}`);
    }
  }

  /**
   * 查询 Checkout 详情
   */
  async getCheckout(checkoutId: string): Promise<CreemCheckoutResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/checkouts/${checkoutId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Failed to get Creem checkout:', error.message);
      throw new Error(`Creem checkout error: ${error.message}`);
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
