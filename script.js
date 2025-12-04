const margin = { top: 30, right: 30, bottom: 50, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const parseNum = (str) => {
    if (!str) return null;
    if (typeof str === 'number') return str;
    return parseFloat(str.replace(',', '.')); 
};

d3.text("global_macroeconomic_indicators.csv").then(raw => {
    const data = d3.dsvFormat(";").parse(raw, d => {
        return {
            country: d["Country Name"],
            region: d.continent,
            year: +d.Year,
            fdi: parseNum(d["Foreign direct investment. net inflows (% of GDP)"]),
            trade: parseNum(d["Trade (% of GDP)"]),
            gdp: parseNum(d["GDP ppp"])
        };
    });

    console.log("Converted Dataset:", data);

    const xExtent = d3.extent(data, d => d.fdi);
    const yExtent = d3.extent(data, d => d.trade);
    const gdpExtent = d3.extent(data, d => d.gdp);

    const xScale = d3.scaleLinear()
        .domain(xExtent).nice()
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(yExtent).nice()
        .range([height, 0]);

    const rScale = d3.scaleSqrt()
        .domain(gdpExtent)
        .range([4, 40]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(["Europe", "Asia", "Africa", "Oceania", "North America", "South America"]);

    const legendContainer = d3.select("#legend");
    const regions = colorScale.domain();

    regions.forEach(region => {
        const item = legendContainer.append("div")
            .attr("class", "legend-item");
        
        item.append("span")
            .text(region);
        
        item.append("span")
            .attr("class", "legend-dot")
            .style("background-color", colorScale(region));
    });

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle")
        .text("FDI Net Inflows (% of GDP)");

    svg.append("g")
        .call(d3.axisLeft(yScale));
        
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .text("Trade (% of GDP)");

    const years = [...new Set(data.map(d => d.year))].sort((a,b) => b - a);
    const yearSelect = d3.select("#yearSelect");
    yearSelect.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    function updateChart() {
        const selectedYear = +d3.select("#yearSelect").property("value");
        const selectedRegion = d3.select("#regionSelect").property("value");

        const formatGDP = d => d3.format(".3s")(d).replace("G", "B");

        let filteredData = data.filter(d => d.year === selectedYear);
        if (selectedRegion !== "All") {
            filteredData = filteredData.filter(d => d.region === selectedRegion);
        }

        const circles = svg.selectAll("circle")
            .data(filteredData, d => d.country);

        circles.join(
            enter => enter.append("circle")
                .attr("cx", d => xScale(d.fdi))
                .attr("cy", d => yScale(d.trade))
                .attr("r", d => rScale(d.gdp))
                .attr("fill", d => colorScale(d.region))
                .append("title")
                .text(d => `${d.country}\nFDI: ${d.fdi}%\nTrade: ${d.trade}%\nGDP PPP: ${formatGDP(d.gdp)}`),
            
            update => update
                .attr("cx", d => xScale(d.fdi))
                .attr("cy", d => yScale(d.trade))
                .attr("r", d => rScale(d.gdp))
                .attr("fill", d => colorScale(d.region))
                .select("title")
                .text(d => `${d.country}\nFDI: ${d.fdi}%\nTrade: ${d.trade}%\nGDP PPP: ${formatGDP(d.gdp)}`),

            exit => exit.remove()
        );
    }

    updateChart();

    d3.select("#yearSelect").on("change", updateChart);
    d3.select("#regionSelect").on("change", updateChart);
});