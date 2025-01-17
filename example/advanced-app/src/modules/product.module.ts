import { Module } from '../../../../dist';
import { ProductController } from '../controllers/product.controller';
import { ProductService } from '../services/product.service';

@Module({
  controllers: [ProductController],
  providers: [
    {
      provide: ProductService,
      useClass: ProductService,
    },
  ],
})
export class ProductModule {}
