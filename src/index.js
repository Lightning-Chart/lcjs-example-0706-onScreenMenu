/*
 * LightningChartJS example for rendering a 'Mesh Circle'.
 */
// Import LightningChartJS
const lcjs = require('@arction/lcjs')

// Import xydata
const xydata = require('@arction/xydata')

// Extract required parts from LightningChartJS.
const { lightningChart, OnScreenMenuButtonType, OnScreenMenuButtonShape, ColorRGBA, SolidFill, PointShape, SolidLine, Themes } = lcjs

const { createProgressiveTraceGenerator, createProgressiveRandomGenerator } = xydata

// NOTE: Using `Dashboard` is no longer recommended for new applications. Find latest recommendations here: https://lightningchart.com/js-charts/docs/basic-topics/grouping-charts/
const dashboard = lightningChart().Dashboard({
    numberOfColumns: 1,
    numberOfRows: 3,
    theme: Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined
})

// Add XY Chart to top Cell in Dashboard.
const chart = dashboard.createChartXY({
    columnIndex: 0,
    columnSpan: 1,
    rowIndex: 0,
    rowSpan: 2,
})

const axisX = chart.getDefaultAxisX().setInterval({
    start: 0,
    end: 100,
})

// Add Zoom Band Chart to bottom Cell in Dashboard.
const zoomBandChart = dashboard.createZoomBandChart({
    columnIndex: 0,
    rowIndex: 2,
})

// Add LineSeries to the XY Chart.
const line = chart.addLineSeries()

// Styles for 2nd LineSeries
const customStrokeStyle = new SolidLine({
    fillStyle: new SolidFill({ color: ColorRGBA(200, 50, 50) }),
    thickness: 2,
})

// Add 2nd LineSeries to the XY Chart.
const line2 = chart.addLineSeries().setStrokeStyle(customStrokeStyle)

// Add PointSeries to the XY Chart.
const point = chart
    .addPointSeries({ pointShape: PointShape.Circle })
    .setPointFillStyle(new SolidFill({ color: ColorRGBA(180, 180, 180) }))
    .setPointSize(10)

zoomBandChart.add(line)
zoomBandChart.add(line2)
zoomBandChart.add(point)

// Array that keeps data of 1st line series
const arr1 = []
// Flag that dispose or restore PointSeries
let checked = false
// Data of point coordinates
let prevPoint

// Fill the Line Series with arbitrary data.
createProgressiveTraceGenerator()
    .setNumberOfPoints(250)
    .generate()
    .toPromise()
    .then((data) => {
        arr1.push(...data)
        line.add(data)
    })

// Stream some random data.
createProgressiveRandomGenerator()
    .setNumberOfPoints(250)
    .generate()
    .setStreamBatchSize(1)
    .setStreamInterval(50)
    .setStreamRepeat(false)
    .toStream()
    .forEach((point) => {
        const y = point.y * (Math.random() * 20) - 10
        line2.add({ x: point.x, y })
        // check intersection of line series
        getIntersection({ x: point.x, y })

        if (point.x > 50 && point.x < 200) {
            const oldInterval = axisX.getInterval()
            axisX.setInterval({
                start: oldInterval.start + 1,
                end: oldInterval.end + 1,
            })
        }
    })

// Add On-Screen menu
chart.addOnScreenMenu(
    [
        [
            // Default buttons
            OnScreenMenuButtonType.ZoomInX,
            OnScreenMenuButtonType.ZoomOutX,
            OnScreenMenuButtonType.ZoomInY,
            OnScreenMenuButtonType.ZoomOutY,
            OnScreenMenuButtonType.ZoomToFit,
            OnScreenMenuButtonType.ToggleAnimations,
            // Custom button
            {
                icon: document.head.baseURI + 'examples/assets/0706/icon.png',
                dimensions: { rows: 1, columns: 1 },
                opacity: '0.8',
                color: 'blue',
                shape: OnScreenMenuButtonShape.RoundedRectangle,
                action: show,
            },
        ],
    ],
    OnScreenMenuButtonShape.RoundedRectangle,
)

// Function for actions of Custom On Screen Menu Button
function show() {
    if (!checked) {
        point.setVisible(false)
    } else {
        point.setVisible(true)
    }
    checked == false ? (checked = true) : (checked = false)
}

function getIntersection(currPoint) {
    // Index of last generated point
    const index = currPoint.x
    if (currPoint.x > 0) {
        // Check if lines were intersected
        if (
            (currPoint.y > arr1[index].y && prevPoint.y < arr1[index - 1].y) ||
            (currPoint.y < arr1[index].y && prevPoint.y > arr1[index - 1].y)
        ) {
            // Find point of intersection
            const interSectionPoint = calculateIntersection(currPoint, prevPoint, arr1[index], arr1[index - 1])
            point.add(interSectionPoint)
        }
        // Reassign curr point as prev. point
        prevPoint = currPoint
    } else {
        // Assign curr point as prev. point
        prevPoint = currPoint
    }
}

// The explanation of formula can be found in the description below
function calculateIntersection(currPoint1, prevPoint1, currPoint2, prevPoint2) {
    // Expressions of numerator
    const exp1 = currPoint1.x * prevPoint1.y - currPoint1.y * prevPoint1.x
    const exp2 = currPoint2.x * prevPoint2.y - currPoint2.y * prevPoint2.x

    const exp3 = currPoint2.x - prevPoint2.x
    const exp4 = currPoint1.x - prevPoint1.x
    const exp5 = currPoint2.y - prevPoint2.y
    const exp6 = currPoint1.y - prevPoint1.y

    // Denominator
    const d1 = (currPoint1.x - prevPoint1.x) * (currPoint2.y - prevPoint2.y)
    const d2 = (currPoint1.y - prevPoint1.y) * (currPoint2.x - prevPoint2.x)
    const d = d1 - d2

    if (d === 0) {
        throw new Error('Number of intersection points is zero or infinity.')
    }

    const px = (exp1 * exp3 - exp4 * exp2) / d
    const py = (exp1 * exp5 - exp6 * exp2) / d

    const p = { x: px, y: py }

    // Return point
    return p
}
