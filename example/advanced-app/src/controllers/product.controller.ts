import { Controller, Get, Post, Inject, ServerRequest } from '../../../../dist';
import { ProductService } from '../services/product.service';
@Controller('/products')
export class ProductController {
  constructor(@Inject(ProductService) private readonly productService: ProductService) {}

  @Get('/')
  getAllProducts(ctx: ServerRequest): void {
    const products = this.productService.getAllProducts();
    ctx.send(products);
  }

  @Post('/')
  createProduct(ctx: ServerRequest): void {
    const productData = ctx.body;
    return this.productService.createProduct(productData);
    /**
    curl -X POST http://localhost:4000/products -H "Content-Type: application/json" -d '{"name": "Product C","price": 200 }'
    */
  }
}
