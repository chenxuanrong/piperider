import { Divider, Text, Box, Flex } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';

import { VennDiagram } from '@upsetjs/venn.js';
import * as d3 from 'd3';

import { Chart } from 'react-chartjs-2';
import { VscServerEnvironment } from 'react-icons/vsc';
import { AnimationOptions } from 'chart.js';

export interface VennChartProps {
  vennChartData: 'base_only | common | target_only';
  animation?: AnimationOptions<'boxplot'>['animation'];
}

export function VennDiagramWidget() {
  const [sets, setSets] = useState([
    { sets: ['A'], size: 12 },
    { sets: ['B'], size: 12 },
    { sets: ['A', 'B'], size: 2 },
  ]);

  // const chartData = [
  //   { sets: ['A'], size: 12 },
  //   { sets: ['B'], size: 12 },
  //   { sets: ['A', 'B'], size: 2 },
  // ];

  useEffect(() => {
    let chart = VennDiagram();
    d3.select('venn').datum(sets).call(chart);
    // d3.selectAll('input').on('change', function () {
    //   d3.select('#venn').datum(d3.getSetIntersections()).call(chart);
    // });
  }, [sets]);

  // const tooltip = d3.select('body').append('div').attr('class', 'venntooltip');

  // d3.selectAll('#rings .venn-circle')
  //   .on('mouseenter', function () {
  //     const node = d3.select('venn').transition();
  //     node.select('path').style('fill-opacity', 0.2);
  //     node
  //       .select('text')
  //       .style('font-weight', '100')
  //       .style('font-size', '36px');
  //   })
  //   .on('mouseleave', function () {
  //     const node = d3.select('venn').transition();
  //     node.select('path').style('fill-opacity', 0);
  //     node
  //       .select('text')
  //       .style('font-weight', '100')
  //       .style('font-size', '24px');
  //   });
  return <div id="venn" style={{ textAlign: 'center' }}></div>;
}
