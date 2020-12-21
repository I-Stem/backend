"use strict";
/**
 * Seeding for Template model
 *
 */
exports.__esModule = true;
var seeder = require("mongoose-seed");
var dotenv = require("dotenv");
dotenv.config();
if(!process.env.MONGO_DB_URL || !process.env.MONGO_DB_NAME)
throw new Error ("invalid mongo db url");

seeder.connect(process.env.MONGO_DB_URL + '/' + process.env.MONGO_DB_NAME, function () {
    seeder.setLogOutput(true);
    seeder.loadModels(["dist/models/Disabilities.js", "dist/models/Industry.js", "dist/models/Skills.js"]);
    seeder.clearModels(["Disabilities", "Industry", "Skills"], function () {
        seeder.populateModels(data, function () {
            seeder.disconnect();
        });
    });
});
var data = [
    {
        model: "Skills",
        documents: [
            {
                name: "Software Engineering"
            },
            {
                name: "Management"
            },
            {
                name: "Design"
            },
            {
                name: "Marketing"
            },
            {
                name: "Operations"
            },
            {
                name: "Sales"
            },
            {
                name: "Product Management"
            },
            {
                name: "Human Resources"
            },
            {
                name: "Data Science"
            },
            {
                name: "Automation"
            },
            {
                name: "Retail"
            },
            {
                name: "Test"
            },
            {
                name: "Research"
            },
            {
                name: "Data Analysis"
            },
            {
                name: "Services"
            },
            {
                name: "Quality Assurance"
            },
        ]

    },
    {
        model: "Industry",
        documents: [
{
name: "Accounting"
},
{
name:"Airlines/Aviation"
},
{
name:"Alternative Dispute Resolution"
},
{
name:"Alternative Medicine"
},
{
name:"Animation"
},
{
name:"Apparel and Fashion"
},
{
name:"Architecture and Planning"
},
{
name:"Arts and Crafts"
},
{
name:"Automotive"
},
{
name:"Aviation and Aerospace"
},
{
name:"Banking"
},
{
name:"Biotechnology"
},
{
name:"Broadcast Media"
},
{
name:"Building Materials"
},
{
name:"Business Supplies and Equipment"
},
{
name:"Capital Markets"
},
{
name:"Chemicals"
},
{
name:"Civic and Social Organization"
},
{
name:"Civil Engineering"
},
{
name:"Commercial Real Estate"
},
{
name:"Computer and Network Security"
},
{
name:"Computer Games"
},
{
name:"Computer Hardware"
},
{
name:"Computer Networking"
},
{
name:"Computer Software"
},
{
name:"Construction"
},
{
name:"Consumer Electronics"
},
{
name:"Consumer Goods"
},
{
name:"Consumer Services"
},
{
name:"Cosmetics"
},
{
name:"Dairy"
},
{
name:"Defense and Space"
},
{
name:"Design"
},
{
name:"E-learning"
},
{
name:"Education Management"
},
{
name:"Electrical and Electronic Manufacturing"
},
{
name:"Entertainment"
},
{
name:"Environmental Services"
},
{
name:"Events Services"
},
{
name:"Executive Office"
},
{
name:"Facilities Services"
},
{
name:"Farming"
},
{
name:"Financial Services"
},
{
name:"Fine Art"
},
{
name:"Fishery"
},
{
name:"Food and Beverages"
},
{
name:"Food Production"
},
{
name:"Fundraising"
},
{
name:"Furniture"
},
{
name:"Gambling and Casinos"
},
{
name:"Glass, Ceramics and Concrete"
},
{
name:"Government Administration"
},
{
name:"Government Relations"
},
{
name:"Graphic Design"
},
{
name:"Health, Wellness and Fitness"
},
{
name:"Higher Education"
},
{
name:"Hospital and Health Care"
},
{
name:"Hospitality"
},
{
name:"Human Resources"
},
{
name:"Import and Export"
},
{
name:"Individual and Family Services"
},
{
name:"Industrial Automation"
},
{
name:"Information Services"
},
{
name:"Information Technology and Services"
},
{
name:"Insurance"
},
{
name:"International Affairs"
},
{
name:"International Trade and Development"
},
{
name:"Internet"
},
{
name:"Investment Banking"
},
{
name:"Investment Management"
},
{
name:"Judiciary"
},
{
name:"Law Enforcement"
},
{
name:"Law Practice"
},
{
name:"Legal Services"
},
{
name:"Legislative Office"
},
{
name:"Leisure, Travel and Tourism"
},
{
name:"Libraries"
},
{
name:"Logistics and Supply Chain"
},
{
name:"Luxury Goods and Jewelry"
},
{
name:"Machinery"
},
{
name:"Management Consulting"
},
{
name:"Maritime"
},
{
name:"Market Research"
},
{
name:"Marketing and Advertising"
},
{
name:"Mechanical Or Industrial Engineering"
},
{
name:"Media Production"
},
{
name:"Medical Device"
},
{
name:"Medical Practice"
},
{
name:"Mental Health Care"
},
{
name:"Military"
},
{
name:"Mining and Metals"
},
{
name:"Mobile Games"
},
{
name:"Motion Pictures and Film"
},
{
name:"Museums and Institutions"
},
{
name:"Music"
},
{
name:"Nanotechnology"
},
{
name:"Newspapers"
},
{
name:"Non-profit Organization Management"
},
{
name:"Oil and Energy"
},
{
name:"Online Media"
},
{
name:"Outsourcing/Offshoring"
},
{
name:"Package/Freight Delivery"
},
{
name:"Packaging and Containers"
},
{
name:"Paper and Forest Products"
},
{
name:"Performing Arts"
},
{
name:"Pharmaceuticals"
},
{
name:"Philanthropy"
},
{
name:"Photography"
},
{
name:"Plastics"
},
{
name:"Political Organization"
},
{
name:"Primary/Secondary Education"
},
{
name:"Printing"
},
{
name:"Professional Training and Coaching"
},
{
name:"Program Development"
},
{
name:"Public Policy"
},
{
name:"Public Relations and Communications"
},
{
name:"Public Safety"
},
{
name:"Publishing"
},
{
name:"Railroad Manufacture"
},
{
name:"Ranching"
},
{
name:"Real Estate"
},
{
name:"Recreational Facilities and Services"
},
{
name:"Religious Institutions"
},
{
name:"Renewables and Environment"
},
{
name:"Research"
},
{
name:"Restaurants"
},
{
name:"Retail"
},
{
name:"Security and Investigations"
},
{
name:"Semiconductors"
},
{
name:"Shipbuilding"
},
{
name:"Sporting Goods"
},
{
name:"Sports"
},
{
name:"Staffing and Recruiting"
},
{
name:"Supermarkets"
},
{
name:"Telecommunications"
},
{
name:"Textiles"
},
{
name:"Think Tanks"
},
{
name:"Tobacco"
},
{
name:"Translation and Localization"
},
{
name:"Transportation/Trucking/Railroad"
},
{
name:
"Utilities"
},
{
name:"Venture Capital and Private Equity"
},
{
name:"Veterinary"
},
{
name:"Warehousing"
},
{
name:"Wholesale"
},
{
name:"Wine and Spirits"
},
{
name:"Wireless"
},
{
name:"Writing and Editing"
}
]
    },
    {
        model: "Disabilities",
        documents: [
            {
                name: "Blindness"
            },
            {
                name: "Hearing impaired: deaf"
            },
            {
                name: "Speech and language disability"
            },
            {
                name: "Locomotor including Orthopedic Disability"
            },
            {
                name: "Cerebral Palsy"
            },
            {
                name: "Muscular dystrophy"
            },
            {
                name: "Specific learning disabilities"
            },
            {
                name: "Multiple disabilities including deaf-blindness"
            },
            {
                name: "Leprosy Cured"
            },
            {
                name: "Dwarfism"
            },
            {
                name: "Acid Attack victims"
            },
            {
                name: "Low Vision"
            },
            {
                name: "Hearing Impaired: hard of hearing"
            },
            {
                name: "Intellectual Disability/Slow Learners"
            },
            {
                name: "Autism spectrum disorder"
            },
            {
                name: "Mental Illness"
            },
        ]

    }
];
