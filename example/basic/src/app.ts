import { Application } from '../../../dist';
import { AppModule } from './app.module';
import appConfig from './config/app.config';
import { appLogger } from './utils/logger';

const app = Application.create(AppModule, appConfig);

app.listen(3000, 'localhost', (port, hostname) => {
  appLogger.info(`Server running on http://${hostname}:${port}`);
});
