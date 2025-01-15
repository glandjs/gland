import { KEY_SETTINGS } from '../enums';
import { AppConfig } from '../interfaces';
import { MemoryCacheStore } from '../../utils';

export type GlobalCache = MemoryCacheStore<string, any>;
export type AppConfigKey = keyof typeof KEY_SETTINGS;
export type AppConfigValue = AppConfig[AppConfigKey];
