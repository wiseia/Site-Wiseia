/* the page's inline D3 overlay script (network mesh + latency HUD over the spatial image),
   moved to a file so the catalog specimen runs the same code; d3 resolves locally */
        (function() {
            // Check if D3 is already loaded
            if (typeof d3 === 'undefined') {
                const script = document.createElement('script');
                script.src = 'assets/d3js.org/d3.v7.min.js';
                script.onload = initCharts;
                document.head.appendChild(script);
            } else {
                initCharts();
            }

            function initCharts() {
                const container = document.getElementById('d3-spatial-overlay');
                if (!container) return;
                
                // Clear previous if any
                container.innerHTML = '';

                // Set up dimensions
                const width = container.clientWidth || 800;
                const height = container.clientHeight || 600;

                const svg = d3.select(container)
                    .append('svg')
                    .attr('width', '100%')
                    .attr('height', '100%')
                    .attr('viewBox', `0 0 ${width} ${height}`)
                    .attr('preserveAspectRatio', 'xMidYMid slice')
                    .style('overflow', 'visible');

                // Define Gradients
                const defs = svg.append('defs');
                
                // Gradient for Area Chart
                const gradient = defs.append('linearGradient')
                    .attr('id', 'chart-gradient')
                    .attr('x1', '0%')
                    .attr('y1', '0%')
                    .attr('x2', '0%')
                    .attr('y2', '100%');
                
                gradient.append('stop')
                    .attr('offset', '0%')
                    .attr('stop-color', '#34d399') // emerald-400
                    .attr('stop-opacity', 0.2);
                
                gradient.append('stop')
                    .attr('offset', '100%')
                    .attr('stop-color', '#34d399')
                    .attr('stop-opacity', 0);

                // 1. Background Network Mesh (Simulated Spatial Mapping)
                const nodeCount = 30;
                const nodes = d3.range(nodeCount).map(() => ({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: Math.random() * 1.5 + 1
                }));

                // Create links based on distance
                const links = [];
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        const dx = nodes[i].x - nodes[j].x;
                        const dy = nodes[i].y - nodes[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 150) {
                            links.push({ source: nodes[i], target: nodes[j], dist });
                        }
                    }
                }

                // Draw Links
                svg.append('g')
                    .attr('class', 'network-links')
                    .selectAll('line')
                    .data(links)
                    .enter()
                    .append('line')
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y)
                    .attr('stroke', '#10b981') // emerald-500
                    .attr('stroke-width', 0.5)
                    .attr('stroke-opacity', d => 1 - d.dist / 150)
                    .attr('class', 'transition-opacity duration-1000');

                // Draw Nodes
                svg.append('g')
                    .attr('class', 'network-nodes')
                    .selectAll('circle')
                    .data(nodes)
                    .enter()
                    .append('circle')
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y)
                    .attr('r', d => d.r)
                    .attr('fill', '#34d399')
                    .attr('fill-opacity', 0.6);

                // 2. HUD Line Chart (Top Right)
                const chartWidth = 200;
                const chartHeight = 80;
                const margin = { top: 10, right: 10, bottom: 20, left: 10 };
                
                // Position HUD
                const hudGroup = svg.append('g')
                    .attr('transform', `translate(${width - chartWidth - 30}, 30)`);

                // HUD Background
                hudGroup.append('rect')
                    .attr('width', chartWidth)
                    .attr('height', chartHeight + 30)
                    .attr('rx', 12)
                    .attr('fill', 'rgba(6, 78, 59, 0.7)') // forest-900/70
                    .attr('stroke', 'rgba(52, 211, 153, 0.2)')
                    .attr('stroke-width', 1)
                    .attr('class', 'backdrop-blur-md');

                // Generate dummy signal data
                const points = 20;
                const data = Array.from({length: points}, (_, i) => ({
                    x: i,
                    y: 40 + Math.sin(i * 0.5) * 15 + Math.random() * 10
                }));

                const xScale = d3.scaleLinear().domain([0, points - 1]).range([margin.left, chartWidth - margin.right]);
                const yScale = d3.scaleLinear().domain([0, 80]).range([chartHeight, margin.top]);

                // Area generator
                const area = d3.area()
                    .curve(d3.curveCatmullRom)
                    .x(d => xScale(d.x))
                    .y0(chartHeight)
                    .y1(d => yScale(d.y));

                // Line generator
                const line = d3.line()
                    .curve(d3.curveCatmullRom)
                    .x(d => xScale(d.x))
                    .y(d => yScale(d.y));

                // Draw Area
                hudGroup.append('path')
                    .datum(data)
                    .attr('fill', 'url(#chart-gradient)')
                    .attr('d', area);

                // Draw Line
                hudGroup.append('path')
                    .datum(data)
                    .attr('fill', 'none')
                    .attr('stroke', '#34d399')
                    .attr('stroke-width', 2)
                    .attr('stroke-linecap', 'round')
                    .attr('filter', 'drop-shadow(0 0 2px rgba(52, 211, 153, 0.5))')
                    .attr('d', line);

                // HUD Labels
                hudGroup.append('text')
                    .attr('x', margin.left)
                    .attr('y', chartHeight + 20)
                    .text('NETWORK LATENCY')
                    .attr('fill', '#a7f3d0') // emerald-200
                    .attr('font-family', 'ui-sans-serif, system-ui')
                    .attr('font-size', '10px')
                    .attr('font-weight', '600')
                    .attr('letter-spacing', '0.05em');

                hudGroup.append('text')
                    .attr('x', chartWidth - margin.right)
                    .attr('y', chartHeight + 20)
                    .text('1.2ms')
                    .attr('text-anchor', 'end')
                    .attr('fill', '#fff')
                    .attr('font-family', 'ui-sans-serif, system-ui')
                    .attr('font-size', '10px')
                    .attr('font-weight', '700');
                    
                // Add animated ping dot
                hudGroup.append('circle')
                    .attr('cx', chartWidth - margin.right - 40)
                    .attr('cy', chartHeight + 17)
                    .attr('r', 3)
                    .attr('fill', '#34d399');
            }
        })();
