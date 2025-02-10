import { DynamicModule, Module } from '@gland/common';
import { VIEWS_METADATA } from '../constant';
import { ViewsConfig } from '../types/config.types';
import { ViewsService } from '../services/views.service';
/**
 * @module ViewsModule
 * @description
 * The ViewsModule is responsible for setting up the views system in the application.
 * It allows you to configure the view engine and the directory locations where
 * the views are stored. You can use the forRoot method to provide custom options
 * for the views configuration including the engine type like ejs pug or hbs
 * and the directories where the views are located. By default it uses ejs
 * as the template engine and a single directory '/views'. This module exports
 * the ViewsService which allows other parts of the application to access
 * and work with the view configurations and render templates based on the
 * provided options.
 */
@Module({})
export class ViewsModule {
  static forRoot(options: ViewsConfig): DynamicModule {
    return {
      module: ViewsModule,
      providers: [
        {
          provide: VIEWS_METADATA.VIEWS_WATERMARK,
          useValue: options,
        },
      ],
      exports: [ViewsService],
    };
  }
}
