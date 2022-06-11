import Cache, { FileSystemCache } from 'file-system-cache';


class CacheAccessor {
  private cache: FileSystemCache;

  constructor(ns: string, private accessKey: string) {
    this.cache = Cache({
      basePath: './storage',
      ns,
    });
  }

  public get(id: string) {
    try {
      const content = this.cache.getSync(this.accessKey);
      const items = JSON.parse(content || '{}');
      return items[id];
    } catch (e) {
      console.error(this.accessKey, 'Ошибка получения из кэша', e);
      return null;
    }
  }

  public getAll() {
    try {
      const content = this.cache.getSync(this.accessKey);
      const items = JSON.parse(content || '{}');
      return items;
    } catch (e) {
      console.error(this.accessKey, 'Ошибка получения всего кэша', e);
      return {};
    }
  }

  public async save(id: string, item: unknown): Promise<void> {
    try {
      const content = this.cache.getSync(this.accessKey, '{}');
      const items = JSON.parse(content || '{}');
      items[id] = item;
      await this.cache.clear();
      this.cache.setSync(this.accessKey, JSON.stringify(items));
    } catch (e) {
      console.error(this.accessKey, 'Ошибка сохранения в кэш', e);
    }
  }
  
  public saveSync(id: string, item: unknown): void {
    try {
      const content = this.cache.getSync(this.accessKey, '{}');
      const items = JSON.parse(content || '{}');
      items[id] = item;
      this.cache.setSync(this.accessKey, JSON.stringify(items));
    } catch (e) {
      console.error(this.accessKey, 'Ошибка сохранения  в кэш', e);
    }
  }

  public async remove(id: string): Promise<void> {
    try {
      const content = this.cache.getSync(this.accessKey);
      const items = JSON.parse(content || '{}');
      delete items[id];
      this.cache.setSync(this.accessKey, JSON.stringify(items));
    } catch (e) {
      console.error(this.accessKey, 'Ошибка удаления из кэша', e);
    }
  }

  public async clear(): Promise<void> {
    try {
      await this.cache.clear();
    } catch (e) {
      console.error(this.accessKey, 'Ошибка очистки кэша ', e);
    }
  }
}

export default CacheAccessor;