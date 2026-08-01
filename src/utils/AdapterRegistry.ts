class AdapterRegistry<TAdapter> {
  private readonly adapters = new Map<string, TAdapter>();

  register(key: string, adapter: TAdapter) {
    this.adapters.set(key, adapter);
  }

  get(key: string) {
    return this.adapters.get(key);
  }

  has(key: string) {
    return this.adapters.has(key);
  }

  keys() {
    return Array.from(this.adapters.keys());
  }
}

export default AdapterRegistry;
