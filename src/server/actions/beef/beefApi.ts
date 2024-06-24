import { addBeefAction } from "@/server/actions/beef/addBeef"
import { refreshArbiterStatusesAction } from "@/server/actions/beef/arbiterChangeStatus"
import { getBeefAction } from "@/server/actions/beef/getBeef"
import { getBeefsAction } from "@/server/actions/beef/getBeefs"
import { refreshBeefStateAction } from "@/server/actions/beef/refreshBeefState"

export const BeefApi = {
  addBeef: addBeefAction,
  getBeef: getBeefAction,
  refreshArbiters: refreshArbiterStatusesAction,
  refreshBeefState: refreshBeefStateAction,
  getBeefs: getBeefsAction,
}
