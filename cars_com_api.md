
Dealer Metrics API
Overview
Retrieve Vehicle Inventory IDs
Request by Dealer Total Metrics Report
Retrieve Dealer Details Report
Retrieve Vehicle Details Report

Dealer Metrics API


Overview
The Dealer Metrics API mainly serves analytics data to partners. This includes summarized information at the Dealer level and at the inventory listing level.
Methods
Request by Dealer Total Metrics Report
This method retrieves vehicle information, analytics and performance reports for all vehicle listings on a given day or month for a Dealer.  Options to paginate the response are also included.
Method type: GET
Retrieve Dealer Details Report 
This method retrieves analytics and performance reports at the Dealer level on a given day or within a given month.
Method type: GET
Retrieve Vehicle Details Report 
This method retrieves vehicle information, analytics and performance reports for a vehicle listing on a given day or month.                          
Method type: GET
Retrieve Vehicle Inventory IDs 
This method retrieves inventory vehicle IDs for a dealer on a given day or within a given month.
Method type: GET
Retrieve Vehicle Inventory IDs
API: 
Dealer Metrics API
API Class: 
Dealer Metrics API
Description: 
This method retrieves inventory vehicle IDs for a dealer on a given day or within a given month.
Method type: GET
 
Environment
URL
development
https://api-st.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/inventory
staging
https://api-it.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/inventory
production
https://api.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/inventory

Requires API key
True
Request
Request Data Formats
Request Parameters
Request Parameter
Type
Example value
Description
Required
customerId
Integer
5785421
Customer ID
yes
day
Integer
1-31
Day - If not passed, request returns month report
no
month
Integer
1-12
Month
yes
year
Integer
2014
Year
yes
apikey
String
xo0HjxkG1087GPUtt0TAxTzrkwhYzAKJ
API Key given by Cars.com
yes

 
By entering a day parameter value to the request, you are making a DAILY request. In this case, the limit to which you can retrieve a response is 30 days back from today's date.
 
If you do not enter a value for the day parameter, you are making a MONTHLY request. In this case, the limit to which you can retrieve a response is 13 months back from today's date.
 
 
 
Response
Response Data Formats
Response type
Header value
xml
Accept: application/xml
json
Accept: application/json

Response Elements
VehicleIdsResult
Element
Type
Description
vehicleIds
VehicleIds
See VehicleIds element description below

VehicleIds
Element
Type
Description
classifiedAdId
String
Classified Ad ID
vinNumber
String
Vehicle Identification Number
stockNumber
String
Stock Number

Response XML Example
<vehicleIdsResult>
    <vehicleIds>
   	 <classifiedAdId>124664742</classifiedAdId>
   	 <vinNumber>1A8HW58218F136420</vinNumber>
   	 <stockNumber>R676649B</stockNumber>
    </vehicleIds>
    <vehicleIds>
   	 <classifiedAdId>125246522</classifiedAdId>
   	 <vinNumber>1C4RJFBT5CC353402</vinNumber>
   	 <stockNumber>C185328A</stockNumber>
    </vehicleIds>
    <vehicleIds>
   	 <classifiedAdId>125246530</classifiedAdId>
   	 <vinNumber>1C6RD6KP8CS128415</vinNumber>
   	 <stockNumber>S513278A</stockNumber>
    </vehicleIds>
</vehicleIdsResult>
Response JSON example
{"VehicleIdsResult": {"vehicleIds": [
      {
      "classifiedAdId": "134316460",
      "vinNumber": "3C6UR4HLXDG570268",
      "stockNumber": "DG570268"
   },
      {
      "classifiedAdId": "134316461",
      "vinNumber": "3C6JR6AG0DG576592",
      "stockNumber": "DG576592"
   },
      {
      "classifiedAdId": "134316462",
      "vinNumber": "3C6UR4CL6DG593490",
      "stockNumber": "DG593490"
   }
]}}
Test
Method Type: 
GET
Endpoint URI: 
http://api.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/inventory

Request by Dealer Total Metrics Report
API: 
Dealer Metrics API
API Class: 
Dealer Metrics API
Description: 
This method retrieves vehicle information, analytics and performance reports for all vehicle listings on a given day or month for a Dealer.  Options to paginate the response are also included.
Method type: GET
Environment
URL
development
https://api-st.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/totalmetrics
staging
https://api-it.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/totalmetrics
production
https://api.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/totalmetrics

Requires API key
True
Request
Request Data Formats
N/A
Request Parameters
Request Parameter
Type
Example value
Description
Required
customerId
Integer
5785421
Customer ID
yes
day
Integer
1-31
Day - If not passed, request returns month report
no
month
Integer
1-12
Month
yes
year
Integer
2014
Year
yes
start
Integer
1
Requested page of results
yes
page_size
Integer
100
Requested number of results per page (Max 1000 per page)
yes
apikey
String
xo0HjxkG1087GPUtt0TAxTzrkwhYzAKJ
API Key given by Cars.com
yes

 
By entering a day parameter value to the request, you are making a DAILY request. In this case, the limit to which you can retrieve a response is 30 days back from today's date.
 
If you do not enter a value for the day parameter, you are making a MONTHLY request. In this case, the limit to which you can retrieve a response is 13 months back from today's date.
 
 
 
Response
Response Data Formats
Response type
Header value
xml
Accept: application/xml
json
Accept: application/json

Response Elements
TotalMetricsResult
Element
Type
Description
start
Int
Starting page of results
page_size
Int
Number of results per page
totalNumberOfVehicleIds
Int
Full number of results that you can paginate through
VehicleDetailsResult
VehicleDetailsResult
See VehicleDetailsResult element description below

VehicleDetailsResult
Element
Type
Description
vehicleInfo
VehicleInfo
See VehicleInfo element description below
leadDetails
LeadDetails
See LeadDetails element description below
contactSummary
ContactSummary
See ContactSummary element description below







VehicleInfo
Element
Type
Description
classifiedAdId
String
Classified Ad ID
stockNumber
String
Stock Number
vehicleYear
String
Vehicle Year
vehicleMake
String
Vehicle Make
vehicleModel
String
Vehicle Model
vin
String
Vin Number
stockType
String
Stock Type Code
vehicleStatus
String
Vehicle Status
listingPrice
String
Listing Price
numberOfPhotos
BigInteger
Total number of photos
sellerNotes
String
Seller Notes
currentAge
BigInteger
Current Age
deletedAge
BigInteger
Deleted Age
deletedLastLeadType
String
Deleted Last Lead Type
deletedLastLeadDateTime
String
Deleted Last Lead Date and Time
priceBadge
String
Price Badge
hotCarInd
Boolean
Hot Car Index
goodThreshold
String
Good Price Badge Threshold Value
greatThreshold
String
Great Price Badge Threshold Value

LeadDetails
Element
Type
Description
adPrintDetails
AdPrintDetails
See AdPrintDetails element description below
mapViewDetails
MapViewDetails
See MapViewDetails element description below
clickThruDetails
ClickThruDetails
See ClickThruDetails element description below
emailDetails
EmailDetails
See EmailDetails element description below
chatDetails
ChatDetails
See ChatDetails element description below

AdPrintDetails
Element
Type
Description
dateTime
Object
Date and time of activity

MapViewDetails
Element
Type
Description
dateTime
Object
Date and time of activity

ClickThruDetails
Element
Type
Description
dateTime
Object
Date and time of activity

EmailDetails
Element
Type
Description
dateTime
Object
Date and time of activity
customerName
String
Customer Email Address
phone
String
Customer phone
phone2
String
Customer secondary phone
fname
String
Customer first name
lname
String
Customer last name

ChatDetails
Element
Type
Description
dateTime
Object
Date and time of activity
handledBy
String
Name of person who handled the Chat session
chatMessageLength
Integer
Length of chat
fname
String
Customer first name
lanme
String
Customer last name

ContactSummary
Element
Type
Description
searchViews
Object
Total number of search views
detailViews
Object
Total number of detail views
conversionRate
Object
Ratio of search views to detail views
totalContacts
Object
Sum of all lead details (including search views and detail views)
financeLeads
Object
Total number of finance leads submitted with finance intent, prequalification or submitted credit application
instantOfferLeads
Object
Total number of leads submitted with an instant offer trade-in appraisal
phoneLead
Object
Total number of phone leads submitted
servicePhoneLead
Object
Total number of service center phone leads submitted

Response XML example
<totalMetricsResult>
   <start>1</start>
   <pageSize>7</pageSize>
   <totalNumberofVehicleIds>387</totalNumberofVehicleIds>
   <vehicleDetailsResult>
      <vehicleInfo>
         <classifiedAdId>653288533</classifiedAdId>
	   <hotCarInd>false</hotCarInd>
	   <priceBadge></priceBadge>
         <stockNumber>FUX96963</stockNumber>
         <vehicleYear>2011</vehicleYear>
         <vehicleMake>MINI</vehicleMake>
         <vehicleModel>Cooper</vehicleModel>
         <vin>WMWSU3C59BTX96963</vin>
         <vehicleStatus>Deleted</vehicleStatus>
         <deletedAge>113</deletedAge>
      </vehicleInfo>
      <leadDetails>
         <clickThruDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/14/2016 05:46 AM CST</dateTime>
         </clickThruDetails>
         <clickThruDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/14/2016 05:47 AM CST</dateTime>
         </clickThruDetails>
         <emailDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/05/2016 05:57 AM CST</dateTime>
            <customerName xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">clrseitz@qis.net</customerName>
            <phone>1234567890</phone>
            <phone2/>
            <fname>Tom</fname>
            <lname>Smith</lname>
         </emailDetails>
      </leadDetails>
      <contactSummary>
         <searchViews xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">1407</searchViews>
         <detailViews xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">16</detailViews>
         <conversionRate xsi:type="xs:double" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">1.14</conversionRate>
         <totalContacts xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">3</totalContacts>
      </contactSummary>
   </vehicleDetailsResult>
   <vehicleDetailsResult>
      <vehicleInfo>
         <classifiedAdId>657220681</classifiedAdId>
	   <hotCarInd>true</hotCarInd>
	   <priceBadge>Great</priceBadge>
         <stockNumber>F6271944</stockNumber>
         <vehicleYear>2016</vehicleYear>
         <vehicleMake>Mazda</vehicleMake>
         <vehicleModel>Mazda3</vehicleModel>
         <vin>3MZBM1W70GM271944</vin>
         <stockType>N</stockType>
         <vehicleStatus>Current</vehicleStatus>
         <listingPrice>21004</listingPrice>
         <numberOfPhotos>20</numberOfPhotos>
         <currentAge>131</currentAge>
      </vehicleInfo>
      <contactSummary>
         <searchViews xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">86</searchViews>
         <detailViews xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">1</detailViews>
         <conversionRate xsi:type="xs:double" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">1.16</conversionRate>
         <totalContacts xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">0</totalContacts>
      </contactSummary>
   </vehicleDetailsResult>
   <vehicleDetailsResult>
      <vehicleInfo>
         <classifiedAdId>650522583</classifiedAdId>
	   <hotCarInd>true</hotCarInd>
	   <priceBadge>Fair</priceBadge>
         <stockNumber>FP189656</stockNumber>
         <vehicleYear>2013</vehicleYear>
         <vehicleMake>Jeep</vehicleMake>
         <vehicleModel>Patriot</vehicleModel>
         <vin>1C4NJRBB0DD189656</vin>
         <vehicleStatus>Deleted</vehicleStatus>
         <deletedAge>108</deletedAge>
      </vehicleInfo>
      <leadDetails>
         <mapViewDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/29/2016 11:40 AM CST</dateTime>
         </mapViewDetails>
         <emailDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/12/2016 09:43 PM CST</dateTime>
            <customerName xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">paigeduvall101@gmail.com</customerName>
         </emailDetails>
         <emailDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/12/2016 09:42 PM CST</dateTime>
            <customerName xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">paigeduvall101@gmail.com</customerName>
            <phone/>
            <phone2/>
            <fname/>
            <lname/>
         </emailDetails>
         <emailDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/11/2016 02:01 PM CST</dateTime>
            <customerName xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">alixvanderwiele@aol.com</customerName>
            <phone/>
            <phone2/>
            <fname/>
            <lname/>
         </emailDetails>
      </leadDetails>
      <contactSummary>
         <searchViews xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">2427</searchViews>
         <detailViews xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">77</detailViews>
         <conversionRate xsi:type="xs:double" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">3.17</conversionRate>
         <totalContacts xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">4</totalContacts>
      </contactSummary>
   </vehicleDetailsResult>
   <vehicleDetailsResult>
      <vehicleInfo>
         <classifiedAdId>656285131</classifiedAdId>
	   <hotCarInd>true</hotCarInd>
	   <priceBadge>GREAT</priceBadge>
         <stockNumber>FUC59564</stockNumber>
         <vehicleYear>2013</vehicleYear>
         <vehicleMake>Ford</vehicleMake>
         <vehicleModel>Escape</vehicleModel>
         <vin>1FMCU9J95DUC59564</vin>
         <vehicleStatus>Deleted</vehicleStatus>
         <deletedAge>1</deletedAge>
      </vehicleInfo>
      <leadDetails>
         <mapViewDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/22/2016 03:20 PM CST</dateTime>
         </mapViewDetails>
         <mapViewDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/22/2016 11:50 AM CST</dateTime>
         </mapViewDetails>
         <mapViewDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/22/2016 00:58 AM CST</dateTime>
         </mapViewDetails>
         <mapViewDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/22/2016 00:57 AM CST</dateTime>
         </mapViewDetails>
      </leadDetails>
      <contactSummary>
         <searchViews xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">1102</searchViews>
         <detailViews xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">29</detailViews>
         <conversionRate xsi:type="xs:double" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">2.63</conversionRate>
         <totalContacts xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">4</totalContacts>
      </contactSummary>
   </vehicleDetailsResult>
   <vehicleDetailsResult>
      <vehicleInfo>
         <classifiedAdId>655531698</classifiedAdId>
	   <hotCarInd>true</hotCarInd>
	   <priceBadge>FAIR</priceBadge>
         <stockNumber>FP832781</stockNumber>
         <vehicleYear>2008</vehicleYear>
         <vehicleMake>Subaru</vehicleMake>
         <vehicleModel>Impreza</vehicleModel>
         <vin>JF1GH63688H832781</vin>
         <stockType>Used</stockType>
         <vehicleStatus>Deleted</vehicleStatus>
         <deletedAge>28</deletedAge>
      </vehicleInfo>
      <leadDetails>
         <clickThruDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/05/2016 06:30 PM CST</dateTime>
         </clickThruDetails>
         <chatDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/05/2016 06:30 PM CST</dateTime>
            <handledBy xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">Justin  Ledbetter</handledBy>
            <chatMessageLength xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">3</chatMessageLength>
            <fname>Tom</fname>
            <lname>Smith</lname>
         </chatDetails>
      </leadDetails>
      <contactSummary>
         <searchViews xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">1347</searchViews>
         <detailViews xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">25</detailViews>
         <conversionRate xsi:type="xs:double" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">1.86</conversionRate>
         <totalContacts xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">2</totalContacts>
      </contactSummary>
   </vehicleDetailsResult>
   <vehicleDetailsResult>
      <vehicleInfo>
         <classifiedAdId>653645083</classifiedAdId>
	   <hotCarInd>false</hotCarInd>
	   <priceBadge></priceBadge>
         <stockNumber>FU025479</stockNumber>
         <vehicleYear>2011</vehicleYear>
         <vehicleMake>Nissan</vehicleMake>
         <vehicleModel>Juke</vehicleModel>
         <vin>JN8AF5MV8BT025479</vin>
         <vehicleStatus>Deleted</vehicleStatus>
         <deletedAge>87</deletedAge>
      </vehicleInfo>
      <leadDetails>
         <adPrintDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/10/2016 04:38 PM CST</dateTime>
         </adPrintDetails>
         <mapViewDetails>
            <dateTime xsi:type="xs:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">01/29/2016 05:39 PM CST</dateTime>
         </mapViewDetails>
      </leadDetails>
      <contactSummary>
         <searchViews xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">1924</searchViews>
         <detailViews xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">26</detailViews>
         <conversionRate xsi:type="xs:double" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">1.35</conversionRate>
         <totalContacts xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">3</totalContacts>
	   <financeLeads xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">10</financeLeads>
	   <instantOfferLeads xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">10</instantOfferLeads>
	   <phoneLead xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">5</phoneLeads>
	   <servicePhoneLead xsi:type="xs:int" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema">5</servicePhoneLead>
      </contactSummary>
   </vehicleDetailsResult>
   <vehicleDetailsResult>
      <classifiedAdId>655007604</classifiedAdId>
      <message>Listing details not found.</message>
   </vehicleDetailsResult>
</totalMetricsResult>


Response JSON example
{"TotalMetricsResult": {
   "start": 1,
   "pageSize": 7,
   "totalNumberofVehicleIds": 387,
   "vehicleDetailsResult":    [
   {
         "vehicleInfo":          {
            "classifiedAdId": "653288533",
            "hotCarInd": false,
            "priceBadge": "FAIR",
            "stockNumber": "FUX96963",
            "vehicleYear": "2011",
            "vehicleMake": "MINI",
            "vehicleModel": "Cooper",
            "vin": "WMWSU3C59BTX96963",
            "vehicleStatus": "Deleted",
            "deletedAge": 113
         },
         "leadDetails":          {
            "adPrintDetails": [],
            "mapViewDetails": [],
            "clickThruDetails":             [
               {"dateTime": "01/14/2016 05:46 AM CST"},
               {"dateTime": "01/14/2016 05:47 AM CST"}
            ],
            "emailDetails": [            {
               "dateTime": "01/05/2016 05:57 AM CST",
               "customerName": "clrseitz@qis.net",
               "phone": "1234567890",
               "phone2": null,
               "fname": "Tom",
               "lname": "Smith"
            }],
            "chatDetails": []
         },
         "contactSummary":          {
            "searchViews": 1407,
            "detailViews": 16,
            "conversionRate": 1.14,
            "totalContacts": 3,
		"financeLeads": 10,
		"instantOfferLeads": 5,
		"phoneLead": 5,
		"servicePhoneLead": 3
         }
      },
      {
         "vehicleInfo":          {
            "classifiedAdId": "657220681",
            "hotCarInd": false,
            "priceBadge": "GREAT",
            "stockNumber": "F6271944",
            "vehicleYear": "2016",
            "vehicleMake": "Mazda",
            "vehicleModel": "Mazda3",
            "vin": "3MZBM1W70GM271944",
            "stockType": "N",
            "vehicleStatus": "Current",
            "listingPrice": "21004",
            "numberOfPhotos": 20,
            "currentAge": 131
         },
         "contactSummary":          {
            "searchViews": 86,
            "detailViews": 1,
            "conversionRate": 1.16,
            "totalContacts": 0,
            "financeLeads": 10,
		"instantOfferLeads": 5,
		"phoneLead": 5,
		"servicePhoneLead": 3
         }
      },
      {
         "vehicleInfo":          {
            "classifiedAdId": "650522583",
            "hotCarInd": true,
            "priceBadge": "GREAT",
            "stockNumber": "FP189656",
            "vehicleYear": "2013",
            "vehicleMake": "Jeep",
            "vehicleModel": "Patriot",
            "vin": "1C4NJRBB0DD189656",
            "vehicleStatus": "Deleted",
            "deletedAge": 108
         },
         "leadDetails":          {
            "adPrintDetails": [],
            "mapViewDetails": [{"dateTime": "01/29/2016 11:40 AM CST"}],
            "clickThruDetails": [],
            "emailDetails":             [
                              {
                  "dateTime": "01/12/2016 09:43 PM CST",
                  "customerName": "paigeduvall101@gmail.com"
                  "phone": null,
                  "phone2": null,
                  "fname": null,
                  "lname": null
               },
                              {
                  "dateTime": "01/12/2016 09:42 PM CST",
                  "customerName": "paigeduvall101@gmail.com"
                  "phone": null,
                  "phone2": null,
                  "fname": null,
                  "lname": null
               },
                              {
                  "dateTime": "01/11/2016 02:01 PM CST",
                  "customerName": "alixvanderwiele@aol.com"
                  "phone": null,
                  "phone2": null,
                  "fname": null,
                  "lname": null
               }
            ],
            "chatDetails": []
         },
         "contactSummary":          {
            "searchViews": 2427,
            "detailViews": 77,
            "conversionRate": 3.17,
            "totalContacts": 4,
            "financeLeads": 10,
		"instantOfferLeads": 5,
		"phoneLead": 5,
		"servicePhoneLead": 3
         }
      },
      {
         "vehicleInfo":          {
            "classifiedAdId": "656285131",
            "hotCarInd": true,
            "priceBadge": "GREAT",
            "stockNumber": "FUC59564",
            "vehicleYear": "2013",
            "vehicleMake": "Ford",
            "vehicleModel": "Escape",
            "vin": "1FMCU9J95DUC59564",
            "vehicleStatus": "Deleted",
            "deletedAge": 1
         },
         "leadDetails":          {
            "adPrintDetails": [],
            "mapViewDetails":             [
               {"dateTime": "01/22/2016 03:20 PM CST"},
               {"dateTime": "01/22/2016 11:50 AM CST"},
               {"dateTime": "01/22/2016 00:58 AM CST"},
               {"dateTime": "01/22/2016 00:57 AM CST"}
            ],
            "clickThruDetails": [],
            "emailDetails": [],
            "chatDetails": []
         },
         "contactSummary":          {
            "searchViews": 1102,
            "detailViews": 29,
            "conversionRate": 2.63,
            "totalContacts": 4,
		"financeLeads": 10,
		"instantOfferLeads": 5,
		"phoneLead": 5,
		"servicePhoneLead": 3
         }
      },
      {
         "vehicleInfo":          {
            "classifiedAdId": "655531698",
            "hotCarInd": true,
            "priceBadge": "FAIR",
            "stockNumber": "FP832781",
            "vehicleYear": "2008",
            "vehicleMake": "Subaru",
            "vehicleModel": "Impreza",
            "vin": "JF1GH63688H832781",
            "stockType": "Used",
            "vehicleStatus": "Deleted",
            "deletedAge": 28
         },
         "leadDetails":          {
            "adPrintDetails": [],
            "mapViewDetails": [],
            "clickThruDetails": [{"dateTime": "01/05/2016 06:30 PM CST"}],
            "emailDetails": [],
            "chatDetails": [            {
               "dateTime": "01/05/2016 06:30 PM CST",
               "handledBy": "Justin  Ledbetter",
               "chatMessageLength": "3"
            }]
         },
         "contactSummary":          {
            "searchViews": 1347,
            "detailViews": 25,
            "conversionRate": 1.86,
            "totalContacts": 2,
            "financeLeads": 10,
		"instantOfferLeads": 5,
		"phoneLead": 5,
		"servicePhoneLead": 3
         }
      },
      {
         "vehicleInfo":          {
            "classifiedAdId": "653645083",
            "hotCarInd": true,
            "priceBadge": "",
            "stockNumber": "FU025479",
            "vehicleYear": "2011",
            "vehicleMake": "Nissan",
            "vehicleModel": "Juke",
            "vin": "JN8AF5MV8BT025479",
            "vehicleStatus": "Deleted",
            "deletedAge": 87
         },
         "leadDetails":          {
            "adPrintDetails": [{"dateTime": "01/10/2016 04:38 PM CST"}],
            "mapViewDetails": [{"dateTime": "01/29/2016 05:39 PM CST"}],
            "clickThruDetails": [],
            "emailDetails": [],
            "chatDetails": []
         },
         "contactSummary":          {
            "searchViews": 1924,
            "detailViews": 26,
            "conversionRate": 1.35,
            "totalContacts": 3,
            "financeLeads": 10,
		"instantOfferLeads": 5,
		"phoneLead": 5,
		"servicePhoneLead": 3
         }
      },
      {
         "classifiedAdId": "655007604",
         "message": "Listing details not found."
      }
   ]
}}
Test
Method Type: 
GET

Retrieve Dealer Details Report
API: 
Dealer Metrics API
API Class: 
Dealer Metrics API
Description: 
This method retrieves analytics and performance reports at the Dealer level on a given day or within a given month.
Method type: GET
 
Environment
URL
development
https://api-st.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/dealer
staging
https://api-it.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/dealer
production
https://api.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/dealer

Requires API key
True
Request
Request Data Formats
Request Parameters
Request Parameter
Type
Example value
Description
Required
customerId
Integer
5785421
Customer ID
yes
day
Integer
1-31
Day - If not passed, request returns month report
no
month
Integer
1-12
Month
yes
year
Integer
2014
Year
yes
apikey
String
xo0HjxkG1087GPUtt0TAxTzrkwhYzAKJ
API Key given by Cars.com
yes

 
By entering a day parameter value to the request, you are making a DAILY request. In this case, the limit to which you can retrieve a response is 30 days back from today's date.
 
If you do not enter a value for the day parameter, you are making a MONTHLY request. In this case, the limit to which you can retrieve a response is 13 months back from today's date.
 
 
 
Response
Response Data Formats
Response type
Header value
xml
Accept: application/xml
json
Accept: application/json

Response Elements
DealerContactDetails
 
Element
Type
Description
 
dealerDirectorySearches
Integer
Number of Dealer directory searches
 
srpViews
Integer
Number of SRP Views
 
vdpViews
Integer
Number of VDP Views
 
newSrpViews
Integer
Number of new SRP Views
 
usedSrpViews
Integer
Number of used SRP Views
 
newVdpViews
Integer
Number of new VDP Views
 
usedVdpViews
Integer
Number of used VDP Views
 
adPrintSummary
AdPrintSummary
See AdPrintSummary element description below
 
mapViewSummary
MapViewSummary
See MapViewSummary element description below
 
clickThruSummary
ClickThruSummary
See ClickThruSummary element description below
 
newEmailSummary
NewEmailSummary
See NewEmailSummary element description below
 
usedEmailSummary
UsedEmailSummary
See UsedEmailSummary element description below
 
newPhoneSummary
NewPhoneSummary
See NewPhoneSummary element description below
 
usedPhoneSummary
UsedPhoneSummary
See UsedPhoneSummary element description below
 
newChatSummary
NewChatSummary
See NewChatSummary element description below
 
usedChatSummary
UsedChatSummary
See UsedChatSummary element description below
 
drivDirContact
Integer
Driving Directions Page Views
 
textToDealer
Integer
Number of contacts by text to dealer
 
dealerEmail
Integer
Number of contacts by dealer email
 
dealerPhone
Integer
Number of Service Phone Contacts

AdPrintSummary
Element
Type
Description
adPrintsOverall
Integer
Overall total ad prints
countNew
String
Total new ad prints
countUsed
String
Total used ad prints
percentNew
String
Percentage of new ad prints
percentUsed
String
Percentage of used ad prints

MapViewSummary
Element
Type
Description
mapViewsOverall
Integer
Overall total map views
countNew
String
Total new map views
countUsed
String
Total used map views
percentNew
String
Percentage of new map views
percentUsed
String
Percentage of used map views

ClickThruSummary
Element
Type
Description
clickThrusOverall
Integer
Overall total click thrus
countNew
String
Total new click thrus
countUsed
String
Total used click thrus
percentNew
String
Percentage new click thrus
percentUsed
String
Percentage used click thrus

NewEmailSummary
Element
Type
Description
newEmailOverall
Integer
Total new email leads

UsedEmailSummary
Element
Type
Description
usedEmailOverall
Integer
Total used email leads

NewPhoneSummary
Element
Type
Description
newPhoneOverall
Integer
Total new phone leads
phoneListing
List: PhoneListing
Class description below

UsedPhoneSummary
Element
Type
Description
usedPhoneOverall
Integer
Total used phone leads
phoneListing
List: PhoneListing
Class description below

PhoneListing
Element
Type
Description
dateTimeReceived
String
Date and Time of call received
callersPhone
String
Caller's phone #
callersZip
String
Caller's zip code
callStatus
String
Call status
callDuration
String
Call duration
callersPhone2
String
Caller’s secondary phone
fname
String
Caller’s first name
lname
String
Caller’s last name

NewChatSummary
Element
Type
Description
newChatOverall
Integer
Total new chat leads

UsedChatSummary
Element
Type
Description
usedChatOverall
Integer
Total used chat leads

Response XML Example
<dealerContactDetails>
 <dealerDirectorySearches>1542</dealerDirectorySearches>
 <newSrpViews>260523</newSrpViews>
 <usedSrpViews>636183</usedSrpViews>
 <srpViews>896706</srpViews>
 <newVdpViews>3571</newVdpViews>
 <usedVdpViews>10692</usedVdpViews>
 <vdpViews>14263</vdpViews>
 <adPrintSummary>
    <adPrintsOverall>19</adPrintsOverall>
    <countNew>8</countNew>
    <countUsed>11</countUsed>
    <percentNew>42</percentNew>
    <percentUsed>58</percentUsed>
 </adPrintSummary>
 <mapViewSummary>
    <mapViewsOverall>80</mapViewsOverall>
    <countNew>20</countNew>
    <countUsed>55</countUsed>
    <percentNew>25</percentNew>
    <percentUsed>69</percentUsed>
 </mapViewSummary>
 <clickThruSummary>
    <clickThrusOverall>34</clickThrusOverall>
    <countNew>11</countNew>
    <countUsed>13</countUsed>
    <percentNew>32</percentNew>
    <percentUsed>38</percentUsed>
 </clickThruSummary>
 <newEmailSummary>
    <newEmailOverall>10</newEmailOverall>
 </newEmailSummary>
 <usedEmailSummary>
    <usedEmailOverall>20</usedEmailOverall>
 </usedEmailSummary>
 <newPhoneSummary>
    <newPhoneOverall>2</newPhoneOverall>
    <phoneListing>
     <dateTimeReceived>07/01/2014 03:41 PM CST</dateTimeReceived>
     <callersPhone>(484) 555-1272</callersPhone>
     <callersZip>19464</callersZip>
     <callStatus>COMPLETED</callStatus>
     <callDuration>7m 21s</callDuration>
     <callersPhone2/>
     <fname>Tom</fname>
     <lname>Smith</lname>
    </phoneListing>
    <phoneListing>
     <dateTimeReceived>07/01/2014 04:16 PM CST</dateTimeReceived>
     <callersPhone>(703) 555-0805</callersPhone>
     <callersZip>22201</callersZip>
     <callStatus>COMPLETED</callStatus>
     <callDuration>4m 19s</callDuration>
     <callersPhone2/>
     <fname/>
     <lname/>
    </phoneListing>
 </newPhoneSummary>
 <usedPhoneSummary>
    <usedPhoneOverall>2</usedPhoneOverall>
    <phoneListing>
     <dateTimeReceived>07/03/2014 02:45 PM CST</dateTimeReceived>
     <callersPhone>(443) 555-2163</callersPhone>
     <callersZip>21202</callersZip>
     <callStatus>COMPLETED</callStatus>
     <callDuration>2m 43s</callDuration>
     <callersPhone2/>
     <fname/>
     <lname/>
    </phoneListing>
    <phoneListing>
     <dateTimeReceived>07/03/2014 02:43 PM CST</dateTimeReceived>
     <callersPhone>(443) 555-2163</callersPhone>
     <callersZip>21202</callersZip>
     <callStatus>COMPLETED</callStatus>
     <callDuration>1m 48s</callDuration>
     <callersPhone2/>
     <fname/>
     <lname/>
    </phoneListing>
 </usedPhoneSummary>
 <newChatSummary>
    <newChatOverall>0</newChatOverall>
 </newChatSummary>
 <usedChatSummary>
    <usedChatOverall>7</usedChatOverall>
 </usedChatSummary>
 <drivDirContact>12</drivDirContact>
 <textToDealer>0</textToDealer>
 <dealerEmail>0</dealerEmail>
 <dealerPhone>0</dealerPhone>
</dealerContactDetails>
Response JSON example
{"DealerContactDetails": {
 "dealerDirectorySearches": 1542,
 "srpViews": 411598,
 "vdpViews": 4921,
 "adPrintSummary": {
  "adPrintsOverall": 19,
  "countNew": "8",
  "countUsed": "11",
  "percentNew": "42",
  "percentUsed": "58"
 },
 "mapViewSummary": {
  "mapViewsOverall": 80,
  "countNew": "20",
  "countUsed": "55",
  "percentNew": "25",
  "percentUsed": "69"
 },
 "clickThruSummary": {
  "clickThrusOverall": 34,
  "countNew": "11",
  "countUsed": "13",
  "percentNew": "32",
  "percentUsed": "38"
 },
 "newEmailSummary": {"newEmailOverall": 10},
 "usedEmailSummary": {"usedEmailOverall": 20},
 "newPhoneSummary":
 {
  "newPhoneOverall": 2,
  "phoneListing":
  [
   {
    "dateTimeReceived": "07/01/2014 03:41 PM CST",
    "callersPhone": "(484) 555-1272",
    "callersZip": "19464",
    "callStatus": "COMPLETED",
    "callDuration": "7m 21s",
    "callersPhone2": "1234567890",
    "fname": "Tom",
    "lname": "Smith”
   },
   {
    "dateTimeReceived": "07/01/2014 04:16 PM CST",
    "callersPhone": "(703) 555-0805",
    "callersZip": "22201",
    "callStatus": "COMPLETED",
    "callDuration": "4m 19s",
    "callersPhone2": null,
    "fname": null,
    "lname": null
   }
  ]
 },
 "usedPhoneSummary":
 {
  "usedPhoneOverall": 2,
  "phoneListing":
  [
   {
    "dateTimeReceived": "07/03/2014 02:45 PM CST",
    "callersPhone": "(443) 555-2163",
    "callersZip": "21202",
    "callStatus": "COMPLETED",
    "callDuration": "2m 43s",
    "callersPhone2": null,
    "fname": null,
    "lname": null
   },
   {
    "dateTimeReceived": "07/03/2014 02:43 PM CST",
    "callersPhone": "(443) 555-2163",
    "callersZip": "21202",
    "callStatus": "COMPLETED",
    "callDuration": "1m 48s",
    "callersPhone2": null,
    "fname": null,
    "lname": null
   }
  ]
 },
 "newChatSummary": {"newChatOverall": 0},
 "usedChatSummary": {"usedChatOverall": 7},
 "drivDirContact": 12,
 "textToDealer": 0,
 "dealerEmail": 0,
 "dealerPhone": 0
}}
Test
Method Type: 
GET
Endpoint URI: 
https://api.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/dealer

Retrieve Vehicle Details Report
API: 
Dealer Metrics API
API Class: 
Dealer Metrics API
Description: 
This method retrieves vehicle information, analytics and performance reports for a vehicle listing on a given day or month.                          
Method type: GET
 
Environment
URL
development
https://api-st.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/listing
staging
https://api-it.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/listing
production
https://api.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/listing

Requires API key
True
Request
Request Data Formats
N/A
Request Parameters
Request Parameter
Type
Example value
Description
Required
classifiedAdId
String 
"f35813fb-1690-4ecd-9f54-20863a8fd0b1"
Classified Ad ID or listing ID (i.e. UUID)
yes
customerId
Integer
5785421
Customer ID
yes
day
Integer
1-31
Day - If not passed, request returns month report
no
month
Integer
1-12
Month
yes
year
Integer
2014
Year
yes
apikey
String
xo0HjxkG1087GPUtt0TAxTzrkwhYzAKJ
API Key given by Cars.com
yes

 
By entering a day parameter value to the request, you are making a DAILY request. In this case, the limit to which you can retrieve a response is 30 days back from today's date.
 
If you do not enter a value for the day parameter, you are making a MONTHLY request. In this case, the limit to which you can retrieve a response is 13 months back from today's date.
 
 
 
Response
Response Data Formats
Response type
Header value
xml
Accept: application/xml
json
Accept: application/json

Response Elements
VehicleDetailsResult
Element
Type
Description
vehicleInfo
VehicleInfo
See VehicleInfo element description below
leadDetails
LeadDetails
See LeadDetails element description below
contactSummary
ContactSummary
See ContactSummary element description below

VehicleInfo
Element
Type
Description
classifiedAdId
String
Classified Ad ID
hotCarInd
Boolean
Hot Car Index
priceBadge
String
Price Badge (GREAT, GOOD, FAIR, “”)
stockNumber
String
Stock Number
vehicleYear
String
Vehicle Year
vehicleMake
String
Vehicle Make
vehicleModel
String
Vehicle Model
vin
String
Vin Number
stockType
String
Stock Type Code
vehicleStatus
String
Vehicle Status
listingPrice
String
Listing Price
numberOfPhotos
BigInteger
Total number of photos
sellerNotes
String
Seller Notes
currentAge
BigInteger
Current Age
deletedAge
BigInteger
Deleted Age
deletedLastLeadType
String
Deleted Last Lead Type
deletedLastLeadDateTime
String
Deleted Last Lead Date and Time
goodThreshold
String
Good Price Badge Threshold Value
greatThreshold
String
Great Price Badge Threshold Value

LeadDetails
Element
Type
Description
adPrintDetails
AdPrintDetails
See AdPrintDetails element description below
mapViewDetails
MapViewDetails
See MapViewDetails element description below
clickThruDetails
ClickThruDetails
See ClickThruDetails element description below
emailDetails
EmailDetails
See EmailDetails element description below
chatDetails
ChatDetails
See ChatDetails element description below

AdPrintDetails
Element
Type
Description
dateTime
Object
Date and time of activity

MapViewDetails
Element
Type
Description
dateTime
Object
Date and time of activity

ClickThruDetails
Element
Type
Description
dateTime
Object
Date and time of activity

EmailDetails
Element
Type
Description
dateTime
Object
Date and time of activity
customerName
String
Customer Email Address
phone
String
Customer phone
phone2
String
Customer secondary phone
fname
String
Customer first name
lname
String
Customer last name

ChatDetails
Element
Type
Description
dateTime
Object
Date and time of activity
handledBy
String
Name of person who handled the Chat session
chatMessageLength
Integer
Length of Chat
fname
String
Customer first name
lname
String
Customer last name

ContactSummary
Element
Type
Description
searchViews
Object
Total number of search views
detailViews
Object
Total number of detail views
conversionRate
Object
Ratio of search views to detail views
totalContacts
Object
Sum of all lead details (including search views and detail views)

Response XML Example
<vehicleDetailsResult>
   <vehicleInfo>
      <classifiedAdId>608175547</classifiedAdId>
	<hotCarInd>true</hotCarInd>
	<priceBadge>Fair</priceBadge>
      <stockNumber>97895B</stockNumber>
      <vehicleYear>2008</vehicleYear>
      <vehicleMake>Honda</vehicleMake>
      <vehicleModel>Accord</vehicleModel>
      <vin>1GCPD38582B239592</vin>
      <stockType>U</stockType>
      <vehicleStatus>Current</vehicleStatus>
      <listingPrice>10488</listingPrice>
      <numberOfPhotos>30</numberOfPhotos>
      <currentAge>57</currentAge>
   </vehicleInfo>
   <leadDetails>
      <mapViewDetails>
         <dateTime>07/26/2014 12:31 PM CST</dateTime>
      </mapViewDetails>
      <clickThruDetails>
         <dateTime>07/25/2014 10:30 AM CST</dateTime>
      </clickThruDetails>
      <clickThruDetails>
         <dateTime>07/25/2014 08:01 PM CST</dateTime>
      </clickThruDetails>
   </leadDetails>
   <contactSummary>
      <searchViews>2309</searchViews>
      <detailViews>49</detailViews>
      <conversionRate>2.12</conversionRate>
      <totalContacts>3</totalContacts>
   </contactSummary>
</vehicleDetailsResult>
Response JSON example
{"VehicleDetailsResult": {
   "vehicleInfo":    {
      "classifiedAdId": "608175547",
      "hotCarInd": true,
      "priceBadge": "GREAT",
      "stockNumber": "97895B",
      "vehicleYear": "2008",
      "vehicleMake": "Honda",
      "vehicleModel": "Accord",
      "vin": "1GCPD38582B239592",
      "stockType": "U",
      "vehicleStatus": "Current",
      "listingPrice": "10488",
      "numberOfPhotos": 30,
      "currentAge": 57
   },
   "leadDetails":    {
      "adPrintDetails": [{"dateTime": "01/10/2016 04:38 PM CST"}],
      "mapViewDetails": [{"dateTime": "07/26/2014 12:31 PM CST"}],
      "clickThruDetails":       [
         {"dateTime": "07/25/2014 10:30 AM CST"},
         {"dateTime": "07/25/2014 08:01 PM CST"}
      ],
      "emailDetails": [            {
               "dateTime": "01/05/2016 05:57 AM CST",
               "customerName": "clrseitz@qis.net",
               "phone": "1234567890",
               "phone2": null,
               "fname": "Tom",
               "lname": "Smith"
            }],
      "chatDetails": [            {
               "dateTime": "01/05/2016 06:30 PM CST",
               "handledBy": "Justin  Ledbetter",
               "chatMessageLength": "3",
               "fname": null,
               "lname": null
            }]
   },
   "contactSummary":    {
      "searchViews": 2309,
      "detailViews": 49,
      "conversionRate": 2.12,
      "totalContacts": 3,
      "financeLeads": 10,
	"instantOfferLeads": 5,
	"phoneLead": 5,
	"servicePhoneLead": 3
   }
}}
Test
Method Type: 
GET
Endpoint URI: 
https://api.cars.com/DealerMetricsService/1.0/rest/reports/contactdetails/listing

