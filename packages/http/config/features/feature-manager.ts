import { ConfigChannel } from '..';
import { BodyParserChannel, CorsChannel, ProxyChannel, SettingsChannel } from './channels';
import { CookieParserChannel } from './channels/cookie-parser.channel';
type OmitChannel<T> = Omit<T, 'createMiddleware'>;

export class FeatureConfigManager {
  private readonly settingsChannel: SettingsChannel;
  private readonly bodyParserChannel: BodyParserChannel;
  private readonly proxyChannel: ProxyChannel;
  private readonly corsChannel: CorsChannel;
  private readonly cookieChannel: CookieParserChannel;

  constructor(configChannel: ConfigChannel) {
    this.settingsChannel = new SettingsChannel(configChannel);
    this.bodyParserChannel = new BodyParserChannel(configChannel);
    this.proxyChannel = new ProxyChannel(configChannel);
    this.corsChannel = new CorsChannel(configChannel);
    this.cookieChannel = new CookieParserChannel(configChannel);
  }

  public get settings(): OmitChannel<SettingsChannel> {
    return this.settingsChannel;
  }
  public get bodyParser(): OmitChannel<BodyParserChannel> {
    return this.bodyParserChannel;
  }
  public get proxy(): OmitChannel<ProxyChannel> {
    return this.proxyChannel;
  }

  public get cors(): CorsChannel {
    return this.corsChannel;
  }

  public get cookies(): OmitChannel<CookieParserChannel> {
    return this.cookieChannel
  }

  public setupMiddleware(app: any): void {
    app.use(this.cookieChannel.createMiddleware())
    app.use(this.proxyChannel.createMiddleware());
    app.use(this.settingsChannel.createMiddleware());
    app.use(this.bodyParserChannel.createMiddleware());
  }
}
