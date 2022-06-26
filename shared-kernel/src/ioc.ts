import { Container } from "inversify";

import killSwitch from "./KillSwitch";
import identifiers from "./constants/identifiers";
import assembleSdk from "./infra/tinkoff";


const baseContainer = new Container();

baseContainer.bind<AbortController>(identifiers.KillSwitch).toConstantValue(killSwitch);

baseContainer.bind(identifiers.TinkoffBuildClientFunc).toFunction(assembleSdk);

export default baseContainer;
