import { Injectable } from '../../../../dist';

@Injectable()
export class ProductService {
  getAllProducts() {
    return [
      { id: 1, name: 'Product A', price: 100 },
      { id: 2, name: 'Product B', price: 150 },
    ];
  }

  createProduct(data: any) {
    return { id: Date.now(), ...data };
  }
}
