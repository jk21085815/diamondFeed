 for (const key in response) {
                if (response.hasOwnProperty(key)) {
                    const market = JSON.parse(response[key]);
                    if (market) {
                        let marketData = await client.get(`${key}_diamond`);
                        marketData = marketData ? JSON.parse(marketData) : null;
                        try{
                            if (marketData) {
                                marketData.status = market.status1 == "ACTIVE" ?"OPEN":market.status1,
                                marketData.inPlay = market.in_play;
                                marketData.noValue = market.l1;
                                marketData.noRate = market.ls1;
                                marketData.yesValue = market.b1;
                                marketData.yesRate = market.bs1;
                                let runner1 = marketData.runners[0]
                                let runner2 = marketData.runners[1]
                                let runner3 = marketData.runners[2]
                                if(runner1){
                                    runner1.status = market.status1
                                    runner1.layPrices[0].price = market.l1
                                    runner1.layPrices[0].line = market.ls1
                                    runner1.backPrices[0].price = market.b1
                                    runner1.backPrices[0].line = market.bs1
                                }
                                if(runner2){
                                    runner2.status = market.status2
                                    runner2.layPrices[0].price = market.l2
                                    runner2.layPrices[0].line = market.ls2
                                    runner2.backPrices[0].price = market.b2
                                    runner2.backPrices[0].line = market.bs2
                                }else{
                                    console.log(marketData.runners,eventId,'marketid with no runnerrrrrr111111')
                                }
                                if(runner3){
                                    runner3.status = market.status3
                                    runner3.layPrices[0].price = market.l3
                                    runner3.layPrices[0].line = market.ls3
                                    runner3.backPrices[0].price = market.b3
                                    runner3.backPrices[0].line = market.bs3
                                }else{
                                    console.log(marketData.runners,eventId,'marketid with no runnerrrr222222222222')
                                }
                                if(marketData.marketId == "12977756"){
                                    console.log(marketData.status, market.status1,'11111111111111111111');
                                    
                                }
                                await client.set(`${marketData.marketId}_diamond`, JSON.stringify(marketData), 'EX', 24 * 60 * 60);
                                // if(marketData.marketId == "12977756"){
                                //     console.log(marketData.marketName,marketData.noValue,marketData.yesValue,marketData.status,'2222222222222222222');
                                    
                                // }
                                fancyArr.push(marketData)
                                // if(eventId == "34164556"){
                                //     console.log(fancyArr.find(item => item.marketId == '12977756'),marketData.status, '00000000000000000');
                                // }
    
                            }
                            else{
                                let tempRunner = []
                                let category = ""
                                let tempObj = {
                                    "marketId": market.id,
                                    "marketTime": new Date(),
                                    "provider": "DIAMOND",
                                    "marketName": market.name,
                                    "bettingType": "LINE",
                                    "marketType": "FANCY",
                                    "status": market.status1 == "ACTIVE" ?"OPEN":market.status1,
                                    "noValue": market.l1,
                                    "noRate": market.ls1,
                                    "yesValue": market.b1,
                                    "yesRate": market.bs1,
                                    "inPlay": market.in_play
                                }
                                // console.log(market.type_code,'market.type_codemarket.type_code')
                                if(["4","10","12","8","5"].includes(market.type_code.toString())){
                                    category = "OVERS"
                                }else if(["42","20","18","22","36","14"].includes(market.type_code.toString())){
                                    category = "BATSMAN"
                                }else if(market.type_code.toString() == "2"){
                                    category = "SINGLE_OVER"
                                }else if(market.type_code.toString() == "28"){
                                    category = "ODD_EVEN"
                                }else if(market.type_code.toString() == "6"){
                                    category = "BALL_BY_BALL"
                                }else{
                                    category = "OTHER"
                                }
                                tempObj.category = category
                                let tempObjrunner1 = 
                                {
                                    "status": market.status1,
                                    "metadata": "",
                                    "runnerName": market.name,
                                    "runnerId": market.id + "1",
                                    "layPrices": [{
                                        "price":market.l1,
                                        "line":market.ls1
                                    }],
                                    "backPrices": [{
                                        "price":market.b1,
                                        "line":market.bs1
                                    }]
                                }
                                let tempObjrunner2 = 
                                {
                                    "status": market.status2,
                                    "metadata": "",
                                    "runnerName": market.name,
                                    "runnerId": market.id + "2",
                                    "layPrices": [{
                                        "price":market.l2,
                                        "line":market.ls2
                                    }],
                                    "backPrices": [{
                                        "price":market.b2,
                                        "line":market.bs2
                                    }]
                                }
                                let tempObjrunner3 = 
                                {
                                    "status": market.status3,
                                    "metadata": "",
                                    "runnerName": market.name,
                                    "runnerId": market.id + "3",
                                    "layPrices": [{
                                        "price":market.l3,
                                        "line":market.ls3
                                    }],
                                    "backPrices": [{
                                        "price":market.b3,
                                        "line":market.bs3
                                    }]
                                }
                                tempRunner.push(tempObjrunner1)
                                tempRunner.push(tempObjrunner2)
                                tempRunner.push(tempObjrunner3)
                                tempObj.runners = tempRunner
                                // if(marketData.marketId == "12976802"){
                                //     console.log(marketData.noValue,marketData.yesValue,marketData.status,'valueeeee');
                                    
                                // }
                                await client.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);
                                fancyArr.push(tempObj)
                            }
                        }catch(error){
                            console.log(error,eventId,":Errorrrrrr")
                        }
                    }
                }
            }
            if(eventId == "34164556"){
                console.log(fancyArr.find(item => item.marketId == '12977756'));
            }