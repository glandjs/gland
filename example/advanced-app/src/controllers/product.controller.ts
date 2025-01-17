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
    const newProduct = this.productService.createProduct(productData);
    ctx.send(newProduct);
  }
}
