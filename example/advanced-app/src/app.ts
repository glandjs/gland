import { Application, Module } from '../../../dist';
import { AppConfig } from './config/app.config';
import { ProductModule } from './modules/product.module';
import { UserModule } from './modules/user.module';

@Module({
  imports: [ProductModule, UserModule],
})
class AppModule {}

const app = Application.create(AppModule, AppConfig);
app.listen(4000, 'localhost', (port, hostname) => {
  console.log(`Advanced Application running on http://${hostname}:${port}`);
});
