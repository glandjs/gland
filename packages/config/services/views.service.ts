import { Inject, Injectable } from '@gland/common';
import { VIEWS_METADATA } from '../constant';
import { ViewsConfig } from '../interface';
/**
 * @service ViewsService
 * This service handles the configuration and setup of the views system.
 * It ensures that the correct templates engine is used and that the views are
 * rendered correctly according to the defined options.
 */
@Injectable()
export class ViewsService {
  constructor(@Inject(VIEWS_METADATA.VIEWS_WATERMARK) readonly options: ViewsConfig) {}
}
