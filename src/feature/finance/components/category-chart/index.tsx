"use client";

import ReactECharts from "echarts-for-react";
import type { Category, CategorySummary } from "../../types";

interface Props {
  data: CategorySummary[];
  categories?: Category[];
  height?: number;
}

export function CategoryChart({ data, categories = [], height = 300 }: Props) {
  const top10 = data.slice(0, 10);
  const colorMap = new Map(categories.map((c) => [c.name, c.color]));

  const pieOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
      type: "scroll",
    },
    series: [
      {
        name: "Category",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["35%", "50%"],
        data: top10.map((c) => ({
          value: Number(c.total.toFixed(2)),
          name: c.category,
          ...(colorMap.get(c.category) && {
            itemStyle: { color: colorMap.get(c.category) },
          }),
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0,0,0,0.5)",
          },
        },
        label: { show: false },
      },
    ],
  };

  return (
    <ReactECharts
      option={pieOption}
      style={{ height }}
      opts={{ renderer: "canvas" }}
      aria-label="Expense category pie chart"
    />
  );
}
