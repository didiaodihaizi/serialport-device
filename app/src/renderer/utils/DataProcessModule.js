
const CnstiMaxFrq = 64*60;

class DataCalculation
{
    constructor() 
    {
        /****************************私有数据******************************* */
        //参数设置标示
        this.IsParamSet = false;

        //参数项对象
        this.cParams = new Params();

        //织物应变传感器零点状态值
        this.IsCalbrtnFinished = false;
        this.iCalbrtnDataCount = 0;
        this.daFssCalbrtnMaxVal = new Array();
        this.daFssCalbrtnMinVal = new Array();

        //二次采样频率值
        this.iSecFrqDataCount = 1;

        //二次采样数据缓冲区                
        this.iDataIndexoffSFDB = -1;
        this.cSecFrqDataBuf = new SecFrqDataBuffer();

        /********************************************************************** */
    }

    /**********************************私有方法************************************ */

    InnerGetSecFrqDataCount(strSecFrq)
    {
        switch(strSecFrq)
        {
            case "64":
            {
                this.iSecFrqDataCount = 1;
            }
            break;

            case "32":
            {
                this.iSecFrqDataCount = 2;
            }
            break;

            case "16":
            {
                this.iSecFrqDataCount = 4;
            }
            break;

            case "8":
            {
                this.iSecFrqDataCount = 8;
            }
            break;

            case "4":
            {
                this.iSecFrqDataCount = 16;
            }
            break;

            case "2":
            {
                this.iSecFrqDataCount = 32;
            }
            break;

            case "1":
            {
                this.iSecFrqDataCount = 64;
            }
            break;

            case "1/2":
            {
                this.iSecFrqDataCount = 128;
            }
            break;

            case "1/4":
            {
                this.iSecFrqDataCount = 256;
            }
            break;

            case "1/8":
            {
                this.iSecFrqDataCount = 512;
            }
            break;

            case "1/16":
            {
                this.iSecFrqDataCount = 1024;
            }
            break;

            default:
            {
                this.iSecFrqDataCount = 1;
            }
            break;
        }

    }

    InnerIsObjectEmpty(cObj)
    {
        for(let Property in cObj)
        {
            return false;
        }
        return true;
    }

    //织物应变传感器数据计算方法
    InnerCalculateFssData(cOriginalData,cResultData)
    {        
        if(true == this.InnerIsObjectEmpty(cOriginalData) || false == Array.isArray(cOriginalData.usaFssADArry) || 0 == cOriginalData.usaFssADArry.length|| null == cResultData)
        {
            return false;
        }
        
        let iDtIndx = 0;
        let daFssRVal = 0;
        for(iDtIndx = 0;iDtIndx < cOriginalData.usaFssADArry.length;++iDtIndx)
        {
            //计算电阻值
            daFssRVal = 200*cOriginalData.usaFssADArry[iDtIndx]/(65536);

            //温度补偿
            let daFssP1Val = this.cParams.daFssP1Coef[iDtIndx]-0.02332+9.77188*Math.pow(10,-4)*this.cParams.dEnvT;
            let daFssP2Val = this.cParams.daFssP2Coef[iDtIndx]-0.01348-0.00152*this.cParams.dEnvT;

            //计算拉伸长度
            let daFssL = daFssP1Val*daFssRVal+daFssP2Val + this.cParams.daFssL0[iDtIndx];

            let daFssLIncRate = 0;
            if(this.cParams.daFssL0[iDtIndx] > 0 )
            {
                daFssLIncRate = 100*(daFssL-this.cParams.daFssL0[iDtIndx])/this.cParams.daFssL0[iDtIndx];
            }
            else
            {
                daFssLIncRate = 0;
            }

            //校准拉伸百分比
            if(false == this.IsCalbrtnFinished)
            {
                if(undefined === this.daFssCalbrtnMaxVal[iDtIndx] || this.daFssCalbrtnMaxVal[iDtIndx] < daFssLIncRate)
                {
                    this.daFssCalbrtnMaxVal[iDtIndx] = daFssLIncRate;
                }

                if(undefined === this.daFssCalbrtnMinVal[iDtIndx] || this.daFssCalbrtnMinVal[iDtIndx] > daFssLIncRate)
                {
                    this.daFssCalbrtnMinVal[iDtIndx] = daFssLIncRate;
                }

                //校准阶段，显示实际长度数据
                cResultData.daFssLArry[iDtIndx] = daFssL;
            }
            else
            {
                 if(daFssLIncRate <= this.daFssCalbrtnMaxVal[iDtIndx] && daFssLIncRate >= this.daFssCalbrtnMinVal[iDtIndx])
                {
                    daFssLIncRate = 0;
                }

                //实验阶段，显示增长百分比数据
                cResultData.daFssLArry[iDtIndx] = daFssLIncRate;
            }

            
        }

        ++this.iCalbrtnDataCount;
        if(this.iCalbrtnDataCount >= CnstiMaxFrq*this.cParams.iCalibrationDur)
        {
            this.IsCalbrtnFinished = true;
        }

        return true;
    }
    
    //压力-温度传感器压力计算方法
    InnerCalculateFTFData(cOriginalData,cResultData)
    {
        if(true == this.InnerIsObjectEmpty(cOriginalData) || false == Array.isArray(cOriginalData.usaFADArry) || 0 == cOriginalData.usaFADArry.length|| null == cResultData)
        {
            return false;
        }

        let iDtIndx = 0;
        let daFRVal = 0;
        for(iDtIndx = 0;iDtIndx < cOriginalData.usaFADArry.length;++iDtIndx)
        {
            //计算电阻值
            daFRVal = 100*cOriginalData.usaFADArry[iDtIndx]/(65536-cOriginalData.usaFADArry[iDtIndx]);
            //根据电阻值计算拉伸长度，再计算成伸缩比
            cResultData.daFArry[iDtIndx] = daFRVal;
        }

        return true;
    }

    //压力-温度传感器温度计算方法
    InnerCalculateFTTData(cOriginalData,cResultData)
    {
        if(true == this.InnerIsObjectEmpty(cOriginalData) || false == Array.isArray(cOriginalData.daTADArry) || 0 == cOriginalData.daTADArry.length || null == cResultData)
        {
            return false;
        }

        let iDtIndx = 0;
        for(iDtIndx = 0;iDtIndx < cOriginalData.daTADArry.length;++iDtIndx)
        {
            cResultData.daTArry[iDtIndx] = cOriginalData.daTADArry[iDtIndx];
        }

        return true;
    }

    //缓冲初始数据
    InnerCacheFrstData(cCRDPkt)
    {
        if(true == this.InnerIsObjectEmpty(cCRDPkt))
        {
            return false;
        }

        //缓存数据列数递增
        ++(this.iDataIndexoffSFDB);
        let iDataIndx = 0;
        
        if(true == Array.isArray(cCRDPkt.daFssLArry) && 0 < cCRDPkt.daFssLArry.length)
        {
            if(this.cSecFrqDataBuf.da2FssDataBuf.length <= 0)
            {
                for(iDataIndx = 0;iDataIndx < cCRDPkt.daFssLArry.length;++iDataIndx)
                {
                    this.cSecFrqDataBuf.da2FssDataBuf[iDataIndx] = new Array();    
                }
            }
            
            //织物应变传感器数据列递增            
            for(iDataIndx = 0;iDataIndx < cCRDPkt.daFssLArry.length;++iDataIndx)
            {
                this.cSecFrqDataBuf.da2FssDataBuf[iDataIndx][this.iDataIndexoffSFDB] = cCRDPkt.daFssLArry[iDataIndx];
            }
        }

        if(true == Array.isArray(cCRDPkt.daFArry) && 0 < cCRDPkt.daFArry.length)
        {
            if(this.cSecFrqDataBuf.da2FDataBuf.length <= 0)
            {
                for(iDataIndx = 0;iDataIndx < cCRDPkt.daFArry.length;++iDataIndx)
                {
                    this.cSecFrqDataBuf.da2FDataBuf[iDataIndx] = new Array();    
                }
            }

            //压力-温度传感器压力数据列递增
            for(iDataIndx = 0;iDataIndx < cCRDPkt.daFArry.length;++iDataIndx)
            {
                this.cSecFrqDataBuf.da2FDataBuf[iDataIndx][this.iDataIndexoffSFDB] = cCRDPkt.daFArry[iDataIndx];
            }
        }

        if(true == Array.isArray(cCRDPkt.daTArry) && 0 < cCRDPkt.daTArry.length)
        {
            if(this.cSecFrqDataBuf.da2TDataBuf.length <= 0)
            {
                for(iDataIndx = 0;iDataIndx < cCRDPkt.daTArry.length;++iDataIndx)
                {
                    this.cSecFrqDataBuf.da2TDataBuf[iDataIndx] = new Array();    
                }
            }
            //压力-温度传感器温度数据行递增
            for(iDataIndx = 0;iDataIndx < cCRDPkt.daTArry.length;++iDataIndx)
            {
                this.cSecFrqDataBuf.da2TDataBuf[iDataIndx][this.iDataIndexoffSFDB] = cCRDPkt.daTArry[iDataIndx];
            }
        }

        return true;
    }

    InnerCalculateSecFrqData(cHRDPkt)
    {
        let iSecFrqDataNum = this.iDataIndexoffSFDB+1;
        
        if(iSecFrqDataNum < (this.iSecFrqDataCount))
        {
            //缓存数据点个数不够，直接返回操作失败
            return false;
        }
        else
        {
            //数据点个数足够了，进行二次采样操作
            let iRowCnt = this.iSecFrqDataCount;
            let iRowIndx = 0;
            let iColumnIndx = 0;
            
            //织物应变传感器数据二次采样
            for(iRowIndx = 0;iRowIndx < this.cSecFrqDataBuf.da2FssDataBuf.length;++iRowIndx)
            {
                let dSumofRow = 0;
                for(iColumnIndx = 0;iColumnIndx < this.cSecFrqDataBuf.da2FssDataBuf[iRowIndx].length;++iColumnIndx)
                {
                    dSumofRow += this.cSecFrqDataBuf.da2FssDataBuf[iRowIndx][iColumnIndx];
                }
                cHRDPkt.daFssLArry[iRowIndx] = dSumofRow/this.iSecFrqDataCount;
                this.cSecFrqDataBuf.da2FssDataBuf[iRowIndx] = new Array();
            }

            //压力温度传感器压力数据二次采样
            for(iRowIndx = 0;iRowIndx < this.cSecFrqDataBuf.da2FDataBuf.length;++iRowIndx)
            {
                let dSumofRow = 0;
                for(iColumnIndx = 0;iColumnIndx < this.cSecFrqDataBuf.da2FDataBuf[iRowIndx].length;++iColumnIndx)
                {
                    dSumofRow += this.cSecFrqDataBuf.da2FDataBuf[iRowIndx][iColumnIndx];
                }
                cHRDPkt.daFArry[iRowIndx] = dSumofRow/this.iSecFrqDataCount;
                this.cSecFrqDataBuf.da2FDataBuf[iRowIndx] = new Array();
            }

            //压力温度传感器温度数据二次采样
            for(iRowIndx = 0;iRowIndx < this.cSecFrqDataBuf.da2TDataBuf.length;++iRowIndx)
            {
                let dSumofRow = 0;
                for(iColumnIndx = 0;iColumnIndx < this.cSecFrqDataBuf.da2TDataBuf[iRowIndx].length;++iColumnIndx)
                {
                    dSumofRow += this.cSecFrqDataBuf.da2TDataBuf[iRowIndx][iColumnIndx];
                }
                cHRDPkt.daTArry[iRowIndx] = dSumofRow/this.iSecFrqDataCount;
                this.cSecFrqDataBuf.da2TDataBuf[iRowIndx] = new Array();
            }

            this.iDataIndexoffSFDB = -1;

            return true;
        }
    }
    /***************************************************************************** */



    /**********************************公有方法************************************ */
    //设置参数，cParams为Params类对象
    SetParams(cParams)
    {
        
        if(true == this.InnerIsObjectEmpty(cParams))
        {
            return false;
        }

        let iDataIndx = 0;
        
        //织物应变传感器初始长度
        for(iDataIndx = 0;iDataIndx < cParams.daFssL0.length;++iDataIndx)
        {
            this.cParams.daFssL0[iDataIndx] = cParams.daFssL0[iDataIndx];
        }

        //织物应变传感器灵敏度系数
        for(iDataIndx = 0;iDataIndx < cParams.daFssP1Coef.length;++iDataIndx)
        {
            this.cParams.daFssP1Coef[iDataIndx] = cParams.daFssP1Coef[iDataIndx];
        }

        //织物应变传感器灵敏度系数
        for(iDataIndx = 0;iDataIndx < cParams.daFssP2Coef.length;++iDataIndx)
        {
            this.cParams.daFssP2Coef[iDataIndx] = cParams.daFssP2Coef[iDataIndx];
        }

        //压力温度传感器灵敏度系数
        for(iDataIndx = 0;iDataIndx < cParams.daFTFCoef.length;++iDataIndx)
        {
            this.cParams.daFTFCoef[iDataIndx] = cParams.daFTFCoef[iDataIndx];
        }

        //二次采样频率
        this.cParams.strSecFrq = cParams.strSecFrq;
        this.InnerGetSecFrqDataCount(this.cParams.strSecFrq);

        //debugger
        //校准时长
        this.cParams.iCalibrationDur = cParams.iCalibrationDur;
        //环境温度
        this.cParams.dEnvT = cParams.dEnvT;

        this.IsParamSet = true;
    }

    //清除缓冲数据
    Reset()
    {
        //织物应变传感器零点状态值
        this.IsCalbrtnFinished = false;
        this.iCalbrtnDataCount = 0;
        this.daFssCalbrtnMaxVal = new Array();
        this.daFssCalbrtnMinVal = new Array();

        //二次采样数据缓冲区
        this.iDataCountofSFDB = -1;
        this.cSecFrqDataBuf = new SecFrqDataBuffer();

        return true;
    }

    //数据计算，OriginalData为OriginalADDataPkt对象，cCRDPkt和cHRDPkt为ResultDataPkt类对象
    StartCalculation(cOriginalData,cCRDPkt,cHRDPkt)
    {
        if(false == this.IsParamSet)
        {
            return false;
        }


        let blOprRet = false;
        
        //计算织物应变传感器拉伸率，百分比数据
        this.InnerCalculateFssData(cOriginalData,cCRDPkt);

        //计算压力温度传感器压力数据
        this.InnerCalculateFTFData(cOriginalData,cCRDPkt);

        //计算压力温度传感器温度数据
        this.InnerCalculateFTTData(cOriginalData,cCRDPkt);

        //缓冲初始数据，二次采样，生成处理数据
        blOprRet = this.InnerCacheFrstData(cCRDPkt);
        if(true == blOprRet)
        {
            blOprRet = this.InnerCalculateSecFrqData(cHRDPkt);
        }

        return blOprRet;
        
    }
    /***************************************************************************** */
}

class SecFrqDataBuffer
{
    constructor()
    {
        this.da2FssDataBuf = new Array();
        this.da2FDataBuf = new Array();
        this.da2TDataBuf = new Array();
    }
}

//参数类申明
class Params
{
    constructor()
    {
        this.daFssL0 = new Array();
        this.daFssP1Coef = new Array();
        this.daFssP2Coef = new Array();
        this.daFTFCoef = new Array();

        this.strSecFrq = "64";
        this.iCalibrationDur = 2;
        this.dEnvT = 20.0;
    }
}

//原始AD数据包
class OriginalADDataPkt
{
    constructor()
    {
        this.usaFssADArry = new Array();
        this.usaFADArry = new Array();
        this.daTADArry = new Array();
    }
}

//结果数据包
class ResultDataPkt
{
    constructor()
    {
        this.daFssLArry = new Array();
        this.daFArry = new Array();
        this.daTArry = new Array();
    }
}

export default{DataCalculation,Params,OriginalADDataPkt,ResultDataPkt}