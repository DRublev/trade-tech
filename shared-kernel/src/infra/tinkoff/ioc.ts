import { Container } from "inversify";

import baseContainer from "../../ioc";
import { createClient, TinkoffClient } from "./client";


const container = new Container();
container.parent = baseContainer;

container.bind<(token: string) => TinkoffClient>('BuildTinkoffClient').toFunction(createClient);

export default container;
