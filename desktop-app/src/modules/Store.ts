class Store {
  private token: string = '';
  private mode: any;

  public get HasToken(): boolean {
    return !!this.token;
  }
  public set Mode(value: any) {
    this.mode = value;
  }
}

const instance = new Store();

export default instance;