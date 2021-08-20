import React from 'react';
import PropTypes from 'prop-types';
import {PlatformStateContext, HeadingText, Grid, GridItem, CardBody, ChartGroup, Card,NrqlQuery,Spinner, AutoSizer, LineChart, SparklineChart, AreaChart, BillboardChart, TableChart,BarChart,PieChart,FunnelChart,JsonChart,HistogramChart, StackedBarChart,HeatmapChart } from 'nr1';
import { timeRangeToNrql } from '@newrelic/nr1-community';
//import moment from 'moment';
var moment = require('moment-timezone');

export default class PreQueryChartVisualization extends React.Component {
  constructor(props) {
    super(props);
    this.state = {}

}

  async componentDidMount() {
    const {nrqlQueries, preQueryAccountId, preQuery, preQueryIgnoreTimePicker, maxColumns} = this.props;
    this.setState({
      nrqlQueries: nrqlQueries,
      preQueryAccountId: preQueryAccountId,
      preQuery: preQuery,
      preQueryIgnoreTimePicker: preQueryIgnoreTimePicker,
      maxColumns: maxColumns ? maxColumns : 3
    },
      ()=>{/* this.runPreQuery() */}
    )
  
  }


  async runPreQuery() {
    const {preQuery, preQueryAccountId, preQueryIgnoreTimePicker, sinceClause} = this.state;
    const nrqlQueryPropsAvailable = preQuery && preQueryAccountId
    

    
    if(nrqlQueryPropsAvailable) {
      const fullPreQuery=`${preQuery} ${preQueryIgnoreTimePicker ? "" : sinceClause}`
      console.log("Pre querying:",fullPreQuery)
        let result = await NrqlQuery.query({formatType:NrqlQuery.FORMAT_TYPE.RAW , query:  fullPreQuery, accountId: preQueryAccountId })
        this.setState({
          whereClauseData: result.data.facets
        })
    }
  }

  componentDidUpdate(prevProps) {
    if(this.props.nrqlQueries !== prevProps.nrqlQueries) {
      //Hack for platform bug
      if(this.props.nrqlQueries[0].chartType) {
        //this code path if the attributes are correctly present
        this.setState({nrqlQueries: this.props.nrqlQueries})
      } else {
        //this code path if they are not present (i.e. platform bug in place and filter applied)
        let hackQueries=[...this.props.nrqlQueries]
        
        if(hackQueries[0]) { hackQueries[0].chartType='pie'; hackQueries[0].filterAttr='country'; hackQueries[0].title=''}
        if(hackQueries[1]) { hackQueries[1].chartType='line'; hackQueries[1].filterAttr='country'; hackQueries[1].title=''}
        console.log("Bug workaround in play",hackQueries)
        this.setState({nrqlQueries: hackQueries})
      }

    }

    if (this.props.maxColumns !== prevProps.maxColumns) {
      this.setState({maxColumns: this.props.maxColumns})
    }

    if (this.props.preQuery !== prevProps.preQuery || this.props.preQueryAccountId !== prevProps.preQueryAccountId || this.props.preQueryIgnoreTimePicker !== prevProps.preQueryIgnoreTimePicker) {
      this.setState({whereClauseData: null,preQuery: this.props.preQuery, preQueryAccountId: this.props.preQueryAccountId, preQueryIgnoreTimePicker: this.props.preQueryIgnoreTimePicker},()=>{this.runPreQuery()})
    }

  }

  // Custom props you wish to be configurable in the UI must also be defined in
  // the nr1.json file for the visualization. See docs for more details.
  static propTypes = {
    /**
     * An array of objects consisting of a nrql `query` and `accountId`.
     * This should be a standard prop for any NRQL based visualizations.
     */

    nrqlQueries: PropTypes.arrayOf(
      PropTypes.shape({
        accountId: PropTypes.number,
        query: PropTypes.string,
      })
    ),
  };


  getChart(chartType) {
    if (chartType === 'line') {
      return LineChart;
    } else if (chartType === 'area') {
      return AreaChart;
    } else if (chartType === 'billboard') {
      return BillboardChart;
    } else if (chartType === 'table') {
      return TableChart;
    } else if (chartType === 'bar') {
      return BarChart;
    } else if (chartType === 'pie') {
      return PieChart;
    } else if (chartType === 'funnel') {
      return FunnelChart;
    } else if (chartType === 'json') {
      return JsonChart;
    } else if (chartType === 'histogram') {
      return HistogramChart;
    } else if (chartType === 'stackedbar') {
      return StackedBarChart;
    } else if (chartType === 'heatmap') {
      return HeatmapChart;
    } else if (chartType === 'sparkline') {
      return SparklineChart; 
     } else {
      return LineChart;
    }
  }

  render() {

    return (

      
      <PlatformStateContext.Consumer>
  {(platformState) => {

      const {nrqlQueries} = this.props;
      const {whereClauseData, preQueryAccountId, preQuery, maxColumns, sinceClause} = this.state;

      let limitMaxColumns = maxColumns > 12 ? 12 : maxColumns

      const preQueryAvailable =
      preQueryAccountId &&  
      preQuery 


      const nrqlQueryPropsAvailable =
      nrqlQueries &&
      nrqlQueries.length > 0 
  
        let newSinceClause=timeRangeToNrql(platformState)
        if(platformState.timeRange && sinceClause && sinceClause!=newSinceClause) {
          this.setState({sinceClause:newSinceClause},()=>{this.runPreQuery()})
        } else if(!sinceClause) {
          this.setState({sinceClause:"since 45 minutes ago"},()=>{
            this.runPreQuery()
          })
        }


 
      if (!nrqlQueryPropsAvailable ) {
        return <EmptyState />;
      }
  
      if (  preQueryAvailable && !whereClauseData ) {
        return <LoadingState />;
      }
  
      
    return <>
    
      <AutoSizer>
        {({width, height}) => { 
           const totalRows = Math.ceil(nrqlQueries.length / limitMaxColumns)
       
           let rows=[]
           for(let row=1; row <= totalRows; row++) {


              let columnSpan=Math.floor(12/limitMaxColumns)
              if(totalRows==row) {
                
                let chartsThisRow = nrqlQueries.length - ((row-1) * limitMaxColumns)
                switch(chartsThisRow) {
                  case 1:
                    columnSpan=12
                    break;
                  case 2:
                    columnSpan=6
                    break;
                  case 3:
                    columnSpan=4
                    break;
                  case 4:
                    columnSpan=3
                    break;
                  case 5:
                    columnSpan=2
                    break;
                  case 6:
                    columnSpan=2
                    break;
                  default:
                    columnSpan=1
                    break;
                }
              } 
                
            
        

              let charts = []
              nrqlQueries.forEach((q,idx)=>{
                if(Math.ceil((idx+1) / limitMaxColumns) == row) {

                 let whereClause=""
                 if(whereClauseData) {
                  whereClause=` where ${q.filterAttr} in (${whereClauseData.map(item=>{return `'${item.name}'`}).join(",")})`
                 }

                //if no timezeon set then use UTC
                 
                 let sinceDay=moment.utc(0, "HH");
                 let untilDay=moment.utc(0, "HH");
                 if(q.timezone) {
                   //Timezeon supplied so set time from zero o'clock in that timezone
                   if(moment.tz.zone(q.timezone) === null ){
                    console.error(`Timezone '${q.timezone}' is not a recognised timezone. Check momentjs.com for valid zones.`)
                   } else {
                    sinceDay=moment.tz(q.timezone).hour(0).minute(0).second(0).millisecond(0)
                    untilDay=moment.tz(q.timezone).hour(0).minute(0).second(0).millisecond(0)
                   }
                }

  
                 

                 let relativeSince=""
       
                 if(q.sinceDays || q.sinceDays===0 ) {
                  relativeSince=`since ${sinceDay.subtract(q.sinceDays,'days').unix()}`
                 }
                 let relativeUntil=""
                 if(q.untilDays || q.untilDays===0) {
                  relativeUntil=`until ${untilDay.subtract(q.untilDays,'days').unix()}`
                 }

                 let timeClause = ""
                if(q.ignoreTimePicker) {
                  if(relativeSince || relativeUntil) {
                    timeClause = `${relativeSince} ${relativeUntil}`
                   } else if(q.defaultSince){
                     timeClause=q.defaultSince
                   }
                } else {
                  if(platformState.timeRange) {
                    timeClause = sinceClause
                  } else {
                    if(relativeSince || relativeUntil) {
                      timeClause = `${relativeSince} ${relativeUntil}`
                     } else if(q.defaultSince){
                      timeClause=q.defaultSince
                    }
                  }
                }     
                
                 
                  let query=`${q.query} ${whereClause} ${timeClause}`
                  console.log(`Query ${idx}:`,query)
                  console.log(q)
                  let Chart = this.getChart(q.chartType ? q.chartType : 'line') 
                  let title = q.title ? <HeadingText type={HeadingText.TYPE.HEADING_4} style={{"margin-bottom": "1em"}}>{q.title}</HeadingText> : ""

                  charts.push( <GridItem columnSpan={columnSpan} style={{padding:"1em"}}>
                      
                          {title}
                          <AutoSizer>
                              {({width, height}) => { 
                                                  return (
                                                  <Grid style={{height:height-(q.title ? 58 : 0), width:width}}>
                                                    <GridItem columnSpan={12}>
                                                    <Chart fullWidth fullHeight
                                                  accountId={q.accountId}
                                                  query={query} 
                                                />
                                                      </GridItem>
                                                  </Grid>
                                                 )
                              }}
                            </AutoSizer>
                    
                    </GridItem>
                  )
                }
              })
            

             rows.push(
               <Grid gapType={Grid.GAP_TYPE.MEDIUM} style={{height:height/totalRows, width:width}}>
               {charts}
               </Grid>
             )
           }
       
          
          return (


          <ChartGroup>
            {rows}
          </ChartGroup>
         
        )}}
      </AutoSizer>
    </>
    }
  }
</PlatformStateContext.Consumer>

      
    );
  }
}

const EmptyState = () => (
  <Card className="EmptyState">
    <CardBody className="EmptyState-cardBody">
      <div>Missing required config</div>
    </CardBody>
  </Card>
);

const LoadingState = () => (
  <Card className="EmptyState">
    <CardBody className="EmptyState-cardBody">
      <Spinner />
    </CardBody>
  </Card>
);

