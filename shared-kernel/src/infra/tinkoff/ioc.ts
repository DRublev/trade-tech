import { Container } from "inversify";

import baseContainer from "../../ioc";


const container = new Container();
container.parent = baseContainer;


export default container;
