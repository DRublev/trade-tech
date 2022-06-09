import { Container } from "inversify";

import identifiers from "@/constants/identifiers";
import killSwitch from "@/KillSwitch";


const baseContainer = new Container();

baseContainer.bind<AbortController>(identifiers.KillSwitch).toConstantValue(killSwitch);

export default baseContainer;
