1.)User flow :
With my product
1)	Searches for Pune Car Repair – Fair Price Checker
2)	Open the website 
3)	Upload the bills /quotes
4)	AI Analyses the bills line by line
5)	Output – The final PDF / Screen is shared with use where he each line item is marked – low ,  high or fair
6)	Feels Fair – Yes/No
7)	If yes – share the car details , model and other detals.
8)	Now depending on the detail the final fair price is shared


2.Job : when users has different qoutations in his hand/ email/ whatapp , Want to decide the pricing is fair or overpriced then he comes to fair price checkers and upload his bill . Post analysis he negotiates with garage owner about the prices – basis on collection of his market intelligence

3.Switch
Push– Issue is when any car owner get his car repair he does not understand the price are fair or not. Suspects the garage owner price  but he does not has domain knowledge about car repairs and its costing. He agrees and ends up overpaying without knowing it fair or unfair
Pull – The price they are paying for repair is fair and its they are getting it repaired at reputed car mechanic or experienced. Evaulation of the car repair cost in 1 minute
Anxiety – The price we are marking the high, low or fair is evaluated on what basis. What is source of my data . The evauluation is correct or wrong. with my app he would be worried about the credibility and genuiness

Habit : User currently only trust his friends and family or the familiar garage owner for the prices and for the maintainance of his car . 

4.User Flow :
What to my users do today – 
1)	Take their car to garages
2)	Get the qouations from different garages
3)	Compare them on overall price
4)	Check price line by line
5)	Doubt they are being charged fair or high
6)	Google they prices that have received or chatgpt
7)	Second call their family & relative
8)	Post research decide  - which looks better to them
9)	Calls or go to garage guy negotiates on the prices he learned from the market
10)	In case if the price is still high – he anways ends up getting his car repaired

Onboarding
1)	Comes to fair checker
2)	Upload the quotes
3)	Get the line line by item result is price high or low
4)	Feels price is fair  or high? yes or no ( if it high we can get it checked in detail)
5)	If yes – share your car number , model and km driven ( Depending on the model I can understand the spare part cost that is being charged ) Second I can give comparison to him against the same model the x garage charged abc amount
6)	Final result

5. V1
1) Does :
1)  AI Read the bill by line by line 
2) Able to indentify the cost is labour cost or spare cost as per its current knowledge
3) Extracts the bills and bifurcate into model , invoice no , spare part name / labour , pricing
4) Able to mark the price is high or low against pune prices compared against 8 bills across 5 garages
2) Doesn’t
1)  Review the quality or capabilities of garage or mechanic
2) Not able to recommend the best garage in the nearby area – based on the problem
3)  Car lookup functionality is not there – that can fetch details like car model and make year
4) Garage referral – through which we can connect users to nearby garages for their repair 

3) Nice to have
1) The user if has 2 to 3 qoutes helping him to understand which one is fair and good deal 

4) How I will know it worked
1) Post the bill analyser result – ask the user if was able to save
2) if he answers yes then its worked 
3) If yes then ask for the total savings

6) Riskiest Assumption

Guess 1 :
1)	If this is false the product is pointless
-	If the AI is not able to read bill line item line by line and give the result the price is high or low
-	If we do not have enough data to get the above line right

2)	How I tested it, and what happened :
-	I uploaded my orginal car bill on chatgpt and asked him to analyse
-	Result – Chatgpt give me the details is the price high or low by each line item
-	But when I went to check its sources it was generic from random website – its could not tell it was for polo only , it did not compare against actual invoice
3)	What changed:
-	Post this we decided the give price analysis result only on the basis of the data collected not through any random website
-	We will feed data in our system so it can gives users results are the real – basis on that user can decide its fair or unfair

Guess 2 :
1)	If this is false the product is pointless

I am assuming when the product will go live – Not sure would people have the need of our product . Because at this point of time we cannot predict or assume that their cars would be at the garages at the point of time our product goes live

2 ) How will I test it :
 
I will be sending the whatsapp to my users asking them to try my product with their old garage bills and ask them to share their results. I will send this to 5 people and out of that 2 respond I will know it worked
3 ) what will change if it fails
1)	I will be reaching out to people in my society or to the people who cars at the garage at currently and then ask him to try my product. 
2)	If this also fails – I might reach out to prospect users through running ads

7)	Milestone

1)	I can upload the car repair bills to analyse the result in two minutes
2)	AI Can analyse the bill line by line item, AI Can extract the bill details like invoice no , spare part name , cost and quantity, AI Can also identify its spare part cost or its labour cost
3)	AI Can tell which line item / spare part cost charged is higher , lower or far, AI Can tell the repair cost is higher or lower ( Against 8 actual orginal pune bills)
4)	I can come always and check the data what I was charged was last time and now for this same service as it saved. User can always go back and check the data
5)	I can tell the App that through the analsysis did I saved money and also measure how much amount






