import { useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import Signatories from "./TravelOrders/Signatories/index"
import Vehicles from "./TravelOrders/Vehicles/index"
import Categories from "./TravelOrders/Categories/index"
import Prioritizations from "./TravelOrders/Prioritizations/index"
import FundSources from "./TravelOrders/FundSources/index"

const TravelOrders = () => {
  const sections = useMemo(
    () => [
      {
        key: "signatories",
        title: "Signatories",
        description: "Add or edit signatories of travels.",
        component: <Signatories />,
      },

      {
        key: "vehicles",
        title: "Vehicles",
        description: "Add or edit vehicles used in travels.",
        component: <Vehicles />,
      },
      {
        key: "categories",
        title: "Categories",
        description: "Add or edit categories used in travels.",
        component: <Categories />,
      },
      {
        key: "prioritizations",
        title: "Prioritizations",
        description: "Add or edit prioritizations used in justifying vehicle provisions.",
        component: <Prioritizations />,
      },
      {
        key: "fundSources",
        title: "Fund Sources",
        description: "Add or edit fund sources used in travels.",
        component: <FundSources />,
      },
    ],
    []
  )

  const [activeKey, setActiveKey] = useState("signatories")

  const active = sections.find((s) => s.key === activeKey) ?? sections[0]

  return (
    <Card>
      <CardHeader className="space-y-0 pb-4">
        <CardTitle className="text-lg">Travels</CardTitle>
        <CardDescription className="text-sm">
          You can change settings here for travel requests
        </CardDescription>
      </CardHeader>

      <CardContent className="border-t p-0">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <aside className="md:col-span-4 lg:col-span-3 border-b md:border-b-0 md:border-r p-4">
            <div className="flex flex-col gap-1">
              {sections.map((item) => {
                const isActive = item.key === activeKey
                return (
                  <Button
                    key={item.key}
                    type="button"
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full h-auto justify-start py-3 px-3 text-left whitespace-normal",
                      isActive ? "" : "hover:bg-muted"
                    )}
                    onClick={() => setActiveKey(item.key)}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="text-sm font-semibold leading-snug break-words">
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground leading-snug break-words">
                        {item.description}
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </aside>

          <section className="md:col-span-8 lg:col-span-9 p-4">
            <div className="mb-4">
              <div className="text-sm font-semibold">{active.title}</div>
              <div className="text-xs text-muted-foreground">{active.description}</div>
            </div>

            <div className="rounded-md border p-4">{active.component}</div>
          </section>
        </div>
      </CardContent>
    </Card>
  )
}

export default TravelOrders


