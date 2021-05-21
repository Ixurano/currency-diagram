window.addEventListener("onload", updateRequest());

function updateRequest() {
    //dropdown values
    var chooseDates = [60, 15, 30, 120, 180];
    var periodData = chooseDates[0];
    var currencyList = ["BTC-EUR", "ETH-EUR", "SUSHI-EUR", "SKL-EUR", "ETC-EUR", "BNT-EUR", "LINK-EUR"];
    var currentCurrency = currencyList[0];

    // dropdownchange ändrar värden för start/end datum samt valutan
    var dropdownChange = function () {
        var newDate = d3.select("#dateDropDown").property('value');
        periodData = newDate;
        var newCurrency = d3.select("#currencyDropDown").property('value');
        currentCurrency = newCurrency;

        //start datum
        var end = new Date();
        var endString = end.toISOString().split('T')[0];
        // auto sätter start från dagens datum -30 dagar
        var start = new Date();
        start.setDate(start.getDate() - periodData);
        var startString = start.toISOString().split('T')[0];
        updateAPI(startString, endString,currentCurrency);
    }

    //dropdown för datum
    var newDateSort = chooseDates;
    var dropdown = d3.select("#container")
        .insert("select", "svg")
        .attr("id", "dateDropDown")
        .on("change", dropdownChange);

    dropdown.selectAll("option")
        .data(newDateSort)
        .enter().append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) {
            return d;
        });

    // dropdown för valuta
    var newCurrencySort = currencyList;
    var dropdown1 = d3.select("#container")
        .insert("select", "svg")
        .attr("id", "currencyDropDown")
        .on("change", dropdownChange);

    dropdown1.selectAll("option")
        .data(newCurrencySort)
        .enter().append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) {
            return d;
        });

    dropdownChange();
}


//API update för att få datan från coinbase
function updateAPI(startString, endString,currentCurrency) {

    $(function () {
        $.ajax({
            type: "GET",
            url: "https://api.pro.coinbase.com/products/"+currentCurrency+"/candles?start=" + startString + "&end=" + endString + "&granularity=86400",
            success: function (data) {
                console.log(data);
                chart(data);
                /** Format
                 * 
                 *  [
                 *     [ time, low, high, open, close, volume ],
                 *     [ 1415398768, 0.32, 4.2, 0.35, 4.2, 12.3 ],
                 *     ...
                 *  ]
                 * 
                 */
            }
        });
    });
}

const chart = (data) => {
    // skapar svgn
    const svg = d3.select('#chart')
    svg.selectAll('*').remove();

    margin = ({ top: 20, right: 30, bottom: 30, left: 60 })
    height = 800;
    width = 800;

    const formatDate = (unixTime) => {
        return new Date(unixTime * 1000);
    }

    console.log("%cData ranges from \n" +
        new Date(data[0][0] * 1000) +
        "\nto \n" +
        new Date((+data[data.length - 1][0] + 1) * 1000), "color: #03b1fc"
    )

    // sätter x-axeln för datamängden samt datum
    const x = d3.scaleTime()
        .domain([formatDate(data[0][0]), formatDate(+data[data.length - 1][0] + 1)])
        .range([0, 600])
        .rangeRound([width - margin.right, margin.left + 20]);

    var xTicks = d3.axisBottom(x)
        .ticks(d3.timeWeek)

    d3.select('#chart').append('g')
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(xTicks);

    // sätter y-axlen för datamänden samt valuta värderna
    const y = d3.scaleLog()
        .domain([d3.min(data, d => d[1]), d3.max(data, d => d[2])])
        .rangeRound([height - margin.bottom, margin.top])

    const yAxis = d3.axisLeft(y)
        .tickFormat(d3.format("$~f"))
        .tickValues(d3.scaleLinear().domain(y.domain()).ticks())

    d3.select('#chart').append('g')
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxis);

    //tooltip funktion
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // ritar candlestick figurerna
    const g = svg.append("g")
        .attr("stroke", "black")
        .selectAll("g")
        .data(data)
        .join("g")
        .attr("transform", d => `translate(${x(formatDate(d[0]))},0)`)
        .on("mouseover", function (d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
                div	.html("<b>" + formatDate(d[0]).toLocaleDateString('fi') + "</b>  open:"  + d[3] + ", close:"  + d[4] +  ", high:"  + d[2] + ", low:"  + d[1]  + ", volume:"  + d[5],)	
                .style("left", (d3.event.pageX) + "px")		 
                .style("top", (d3.event.pageY - 20)  + "px" );	
        })
        .on("mouseout", function (d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });

    //ritar "veken"
    g.append("line")
        .attr("y1", d => y(d[1]))
        .attr("y2", d => y(d[2]));
        
    // ritar "ljuset" 
    g.append("line")
        .attr("y1", d => y(d[3]))
        .attr("y2", d => y(d[4]))
        .attr("stroke-width", width / data.length * 0.5)
        .attr("stroke", d => d[3] > d[4] ? '#c71010'
            : d[4] > d[3] ? '#55c400'
                : '#55c400');

}

