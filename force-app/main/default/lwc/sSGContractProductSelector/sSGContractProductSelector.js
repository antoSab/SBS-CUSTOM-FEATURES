import { LightningElement, api, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import FORM_FACTOR from '@salesforce/client/formFactor';
import getProducts from '@salesforce/apex/SSG_ContractProductSelectorHelper.getProducts';
import getRelatedOptions from '@salesforce/apex/SSG_ContractProductSelectorHelper.getRelatedOptions';
import getPicklistsValues from '@salesforce/apex/SSG_ContractProductSelectorHelper.getPicklistsValues';
import importLineItem from '@salesforce/apex/SSG_ContractProductSelectorHelper.importLineItem';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import OPPORTUNITY_PRODUCT_OBJECT from '@salesforce/schema/OpportunityLineItem';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import getAccessLevel from '@salesforce/apex/SSG_ContractProductSelectorHelper.getAccessLevel';
import Id from '@salesforce/user/Id';
import helpModal from './helpModal';

const PRODUCT_SELECTION_COLUMNS = [
	{type: "button-icon", initialWidth: 20, typeAttributes: {
        	name: 'Add',
        	title: 'Add',
        	disabled: false,
        	value: 'Add',
        	iconName: 'utility:add',
			variant: {fieldName: 'button_variant'},

			size: 'xx-small',
    	}, cellAttributes: {style: {fieldName: 'rowClass'},}
	},
	{label: 'Code', type: 'Text', fieldName: 'ProductCode', cellAttributes: {style: {fieldName: 'rowClass'}}, typeAttributes: {tooltip: {fieldName: 'tooltip'}}},
	{label: 'Name', type: 'Text', fieldName: 'Name', cellAttributes: {style: {fieldName: 'rowClass'}}},
	{label: 'Description', type: 'Text', fieldName: 'Description', cellAttributes: {style: {fieldName: 'rowClass'}}},
	{label: 'GTM Offering', type: 'Text', fieldName: 'Offer_GTM__c', cellAttributes: {style: {fieldName: 'rowClass'}}},
	{label: 'Business Domain', type: 'Text', fieldName: 'Sub_GTM__c', cellAttributes: {style: {fieldName: 'rowClass'}}},
	{label: 'Status', type: 'Text', fieldName: 'Catalog__c', cellAttributes: {style: {fieldName: 'rowClass'}}},
	{label: 'Partner Product', type: 'boolean', fieldName: 'Partner_Product__c', cellAttributes: {style: {fieldName: 'rowClass'}}},
];
const OPTIONS_COLUMNS = [
	{label: 'Code', type: 'Text', fieldName: 'ProductCode', initialWidth: 170, cellAttributes: {style: {fieldName: 'rowClass'}}},
	{label: 'Name', type: 'Text', fieldName: 'Name', wrapText: true, initialWidth: 170, cellAttributes: {style: {fieldName: 'rowClass'}}},
	{label: 'GTM Offering', type: 'Text', fieldName: 'Offer_GTM__c', initialWidth: 220, cellAttributes: {style: {fieldName: 'rowClass'}}},
	{label: 'Business Domain', type: 'Text', fieldName: 'Sub_GTM__c', initialWidth: 200, cellAttributes: {style: {fieldName: 'rowClass'}}},
	{label: 'Specific Domain', type: 'Text', fieldName: 'Business_Sub_Domain__c', initialWidth: 200, cellAttributes: {style: {fieldName: 'rowClass'}}},
	{label: 'Status', type: 'Text', fieldName: 'Catalog__c', initialWidth: 170, cellAttributes: {style: {fieldName: 'rowClass'}}},
	{label: 'Description', type: 'Text', fieldName: 'Description', initialWidth: 700, cellAttributes: {style: {fieldName: 'rowClass'}}}
];
const TREEGRID_COLUMNS = [
	{label: 'Name', type: 'Text', fieldName: 'Name', initialWidth: 300},
	{type: "button-icon", typeAttributes: {
		name: 'Delete',
		title: 'Delete',
		disabled: false,
		value: 'Delete',
		iconName: 'utility:delete',
		variant: 'container',
	}
	},
	{label: 'Code', type: 'Text', fieldName: 'ProductCode', initialWidth: 170},
	{label: 'GTM Offering', type: 'Text', fieldName: 'Offer_GTM__c', initialWidth: 220},
	{label: 'Business Domain', type: 'Text', fieldName: 'Sub_GTM__c', initialWidth: 200},
	{label: 'Status', type: 'Text', fieldName: 'Catalog__c', initialWidth: 170},
	{label: 'Description', type: 'Text', fieldName: 'Description', initialWidth: 1000},

];

const DISABLED_OUT = 'disabled-out';
const DISABLED_GEOGRAPHY = 'disabled-geography';
const MEA_BU = 'DISTRIBUTION MEA';
const COUNTRY_AVAILABILITY_VALUE_MEA = 'MEA';
export default class SSGProductSelectorPageOne extends NavigationMixin(LightningElement){

	productQueryFields = [ 'Id', 'Name', 'ProductCode', 'Offer_GTM__c', 'Sub_GTM__c', 'Catalog__c', 'Description', 'Partner_Product__c', 'Country_availability__c'];
	optionQueryFields = ['Id', 'Name', 'ProductCode', 'Parent_Product__r.Name', 'Offer_GTM__c', 'Sub_GTM__c', 'Business_Sub_Domain__c', 'Catalog__c', 'Description'];

	@api RecordId;
	@api ContractName;
	@api currentProduct;
	@api currentOptions = [];
	@api checkboxValue;
	@api isLoading = false;
	isRelatedOptionEmpty;

	// product Filters values
	@api productNameCodeValue = 'null';
	@api productStatusValue;
	@api productBusinessDomainValue;
	@api productPartnerValue;
	@api productOfferGTM;

	@api productNameCodeFilter;
	@api productStatusFilter;
	@api productBDFilter;
	@api productGTMOfferingFilter;
	@api productPartnerFilter;

	@api optionNameCodeFilter;
	@api optionStatusFilter;
	@api optionOffertGTMFilter;
	@api optionBDFilter;
	@api optionBSubDFilter;

	//option Filters values
	@api optionStatusValue;
	@api optionBusinessDomainValue;
	@api optionNameCodeValue = 'null';
	@api optionBusinessSubDomainValue;
	@api optionOfferGTM;

	// modal
	@track optionsSelectionModalOpen = false;
	@track modalPageOne = false;
	@track modalPageTwo = false;

	// buttons controls
	@api next_visible = false;
	@api back_visible = false;
	@api import_visible = false;
	@api import_disabled = false;

	// datatables data
	@api treeGridLoading = false;
	@api productSelectionData;
	@api optionSelectionData;
	productSelectionColumns = PRODUCT_SELECTION_COLUMNS;
	optionSelectionColumns = OPTIONS_COLUMNS;
	@api selectedProducts;
	selectedIdsMap = {};
	@api treeGridData = [];
	treeGridColumns = TREEGRID_COLUMNS;
	@api optionsSelected;
	@api fullList = [];
	@api fullMap = {};
	@api importList = [];
	mobileOptionsIdList = [];
	selectedOptionCheckboxes = [];
	optionSelectedForProduct = [];

	//picklists
	@api statuses;
	@api businessDomains;
	@api deliveryModes;
	@api partnerProducts;
	@api businessSubDomains;
	@api offerGTMs;
	@api expandRowsFirstTime = false;
  @api ContractOwner;
	@api userId;
	@api selectedRows =[];
	@api optionsMap;
	@api ContractBU;
	@api optyISOcode;
	@api OptyLineItemInfo;
	doneTypingInterval = 500;
    typingTimer;
	contractStatus;

	checkboxOptions = [
		{label: 'Yes', value: 'yes'},
		{label: 'No', value: 'no'}
	];

	get isDesktop(){
		if(FORM_FACTOR === 'Large' || FORM_FACTOR === 'Medium'){
			return true;
		} else return false;
	}

	get treeEmpty(){
		return this.treeGridData.length == 0;
	}

	get deliveryModeLabel(){
		return this.OptyLineItemInfo.fields.Delivery_Mode__c.label;
	}

	get offTheShelfLabel(){
		return this.OptyLineItemInfo.fields.Licence_Price__c.label;
	}

	get annualMaintenanceLabel(){
		return this.OptyLineItemInfo.fields.Annual_Maintenace__c.label;
	}

	get entryFeeLabel(){
		return this.OptyLineItemInfo.fields.Entry_Fee__c.label;
	}

	get annualSubscriptionLabel(){
		return 'SW Annual Subscription / Run price';
		//return this.OptyLineItemInfo.fields.Annual_Subscription_price__c.label;
	}

	@wire(getObjectInfo, { objectApiName: OPPORTUNITY_PRODUCT_OBJECT })
	oppInfo({ data, error }) {
        if (data) this.OptyLineItemInfo = data;
    }

	disconnectedCallback(){
		console.log('disconnected')
	}

	goBackIfNotOwner(){

		getAccessLevel({userId: Id, recordId: this.RecordId})
		.then(data => {
			if(!data.HasEditAccess){
				const event = new ShowToastEvent({
					title: 'Access Denied',
					message: 'You are not the Contract Owner',
					//message: 'The Product \'{0}\' has no Related Options!',
					//messageData: [this.currentProduct.Name.toUpperCase(),],
					variant: 'error'
				});
				this.dispatchEvent(event);
				this.goToContract();
			}
		})
		.catch(error => {
			console.error(error);
		})
	}
	connectedCallback(){
		console.log('connected')
    if(this.ContractOwner.length != Id){
			this.userId = Id.slice(0, -3);
		}

		this.currentOptions = [];
		this.productNameCodeValue = 'null';
		this.optionsSelected;
		this.fullList = [];
		this.fullMap = {};
		this.importList = [];
		this.mobileOptionsIdList = [];
		this.selectedOptionCheckboxes = [];
		this.selectedIdsMap = {};
		this.treeGridData = [];
		this.optionsSelectionModalOpen = false;
		this.modalPageOne = false;
		this.modalPageTwo = false;
		this.next_visible = false;
		this.back_visible = false;
		this.import_visible = false;
		this.import_disabled = false;

		// setting up buttons
		this.isLoading = true;
		this.next_visible = true;
		this.back_visible = false;
		this.import_disabled = true;
		this.import_visible = false;
		this.getFilteredProducts();
		this.isLoading = false;

	}

	renderedCallback(){
		try{
			this.expandRows();
		} catch {
			console.log('HEHEHE')
		}
		this.goBackIfNotOwner();
		console.log(this.contractStatus);
		if(this.contractStatus == 'Activated'){
			this.dispatchEvent(new ShowToastEvent({
				title: 'Access Denied',
				message: 'The contract is active',
				//message: 'The Product \'{0}\' has no Related Options!',
				//messageData: [this.currentProduct.Name.toUpperCase(),],
				variant: 'error'
			}))
			this.goToContract();
		}
	}

	goToContract(event) {
		this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.RecordId,
                actionName: 'view',
            },
        });
	}

	// GETTING PARAMETERS FROM URL
    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
       if (currentPageReference) {
		this.RecordId = currentPageReference.state.c__RecordId;
		this.ContractName = currentPageReference.state.c__ContractName;
      	this.ContractOwner = currentPageReference.state.c__ContractOwner;
      	this.ContractBU = currentPageReference.state.c__ContractBU;
		this.optyISOcode = currentPageReference.state.c__OpportunityISOcode;
		this.contractStatus = currentPageReference.state.c__ContractStatus;
		this.treeGridData = [];
		this.selectedIdsMap = [];
       	}
    }

	@wire(getPicklistsValues)
	getPicklistsValuesHandler({data, error}){
		if(data){
			let picklistsEntriesMap = JSON.parse(data);
			this.statuses = [{label: '--None--', value: 'null'}, ...picklistsEntriesMap['Status']];
			this.statuses = this.statuses.filter(status => status.value != 'DELETED')
			this.businessDomains = [{label: '--None--', value: 'null'}, ...picklistsEntriesMap['Business Domain']];
			this.deliveryModes = [{label: '--None--', value: 'null'}, ...picklistsEntriesMap['Delivery Mode']];
			this.businessSubDomains = [{label: '--None--', value: 'null'}, ...picklistsEntriesMap['Business Sub Domain']];
			this.partnerProducts = [
				{label: '--None--', value: 'null'},
				{label: 'Yes', value: 'true'},
				{label: 'No', value: 'false'}
			]
			this.offerGTMs = [{label: '--None--', value: 'null'}, ...picklistsEntriesMap['Offer GTM']];
			console.log(this.statuses);
		} else if(error){
			console.error(error);
		}
	}

	//switch throught pages
	navigationHandler(event){
		let pressedButton = event.target.value;
		console.log('[sSGProductSelectorPageOne/navigationHandler] pressed button: ', pressedButton);
		switch (pressedButton) {
			case 'Next':{
				this.fullList = [];
				this.treeGridData.forEach(product => {
					this.fullList = [...this.fullList, product];
					this.fullMap[product.Id] = product;
					if(product.hasOwnProperty('_children') && product._children.length > 0){
						product._children.forEach(option => {
							this.fullList = [...this.fullList, option];
							this.fullMap[option.Id] = option;
						})
					}
				});

				this.importList = this.fullList.map(prod => {
					return {
						productId: prod.Id,
						deliveryMode: 'empty',
						licencePrice: 'empty',
						entryFee: 'empty',
						annualMainteinance: 'empty',
						annualSubscription: 'empty',
						cost: 'empty',
						priceMetrics: 'empty',
						quantity: 1
					}
				});

				this.next_visible = false;
				this.back_visible = true;
				this.import_disabled = true;
				this.import_visible = true;
				console.log('[sSGProductSelectorPageOne/navigationHandler/next] treeGridData: ', this.treeGridData);
			} break;
			case 'Back':{
				this.next_visible = true;
				this.back_visible = false;
				this.import_disabled = true;
				this.import_visible = false;
				console.log('[sSGProductSelectorPageOne/navigationHandler/back] treeGridData: ', this.treeGridData);
			} break;
			case 'Import':{
				console.log('To Import: ', this.importList);
				this.importData();
			} break;
		}
	}

	async getFilteredProducts(){

		let currentFilterNames = [];
		let currentFilterValues = [];
		if(this.statusValue !== 'null'){
			currentFilterNames = [...currentFilterNames, 'Catalog__c'];
			currentFilterValues = [...currentFilterValues, this.productStatusValue];
		}
		if(this.businessDomainValue !== 'null'){
			currentFilterNames = [...currentFilterNames, 'Sub_GTM__c'];
			currentFilterValues = [...currentFilterValues, this.productBusinessDomainValue];
		}
		if(this.productPartnerValue !== 'null'){
			currentFilterNames = [...currentFilterNames, 'Partner_Product__c'];
			currentFilterValues = [...currentFilterValues, this.productPartnerValue];
		}
		if(this.productOfferGTM !== 'null'){
			currentFilterNames = [...currentFilterNames, 'Offer_GTM__c'];
			currentFilterValues = [...currentFilterValues, this.productOfferGTM];
		}


		await getProducts({
			fields: this.productQueryFields,
			filterName: currentFilterNames,
			filterValue: currentFilterValues,
			name: this.productNameCodeValue,
      OpportunityISOcode: this.optyISOcode
      })
		.then((result) => {
			console.log('CIAO')
      		this.productSelectionData = result.map( product => {
        	let productCopy = {...product};
				productCopy['button_variant'] = 'brand'
				if(product.Catalog__c === 'OUT'){
					productCopy['rowClass'] = 'background: lightgray; color: #747474';
					productCopy['disabled'] = true;
					productCopy['disabled_info'] = DISABLED_OUT;
					productCopy['button_variant'] = 'border'
				}
				console.log('BU', this.ContractBU);
				if(product.hasOwnProperty('Country_Availability__c')) console.log('Availability', product.Country_availability__c);
				if(
					this.ContractBU == MEA_BU &&
					(
						(product.hasOwnProperty('Country_availability__c') && (product.Country_availability__c == '' ||  !product.Country_availability__c.includes(COUNTRY_AVAILABILITY_VALUE_MEA))) ||
						!product.hasOwnProperty('Country_availability__c')
					)
				){
					productCopy['rowClass'] = 'background: lightgray; color: #747474';
					productCopy['disabled'] = true;
					productCopy['disabled_info'] = DISABLED_GEOGRAPHY;
					productCopy['button_variant'] = 'border'
					console.log('CIAO')
				}
				return productCopy;
			})

			console.log(this.productSelectionData);
			//this.productSelectionData = result;
		})
	}

	getRelOptions(addToTreeGrid = false){
		this.optionSelectionData = [];

		let currentFilterNames = ['Catalog__c', 'Sub_GTM__c', 'Business_Sub_Domain__c', 'Offer_GTM__c'];
		let currentFilterValues = [this.optionStatusValue, this.optionBusinessDomainValue, this.optionBusinessSubDomainValue, this.optionOfferGTM];

		console.log(currentFilterValues);

		getRelatedOptions({
			productId: this.currentProduct.Id,
			fields: this.optionQueryFields,
			filterName: currentFilterNames,
			filterValue: currentFilterValues,
			name: this.optionNameCodeValue
		})
		.then((result) => {
			//this.optionSelectionData = result;
      this.optionsMap = {};
			this.optionSelectionData = result.map( option => {
				let optionCopy = {...option};
				if(option.Catalog__c === 'OUT'){
					optionCopy['rowClass'] = 'background: lightgray;';
					optionCopy['disabled'] = true;
				}
				this.optionsMap[optionCopy.Id] = optionCopy;
				return optionCopy;
			})
			this.selectedOptionCheckboxes = {};
			if(this.optionSelectionData.length > 0){
				this.optionSelectionData.forEach(option => {
					this.selectedOptionCheckboxes[option.Id] = false;
				})
			}
			if (addToTreeGrid) {
				if(!this.optionSelectionData?.length){
					this.isRelatedOptionEmpty = true;
					this.addToTreeGrid();
					const message = `The Product '${this.currentProduct.Name.toUpperCase()}' has no Related Options!`;
					const event = new ShowToastEvent({
						title: 'Product Selected',
						message,
						//message: 'The Product \'{0}\' has no Related Options!',
						//messageData: [this.currentProduct.Name.toUpperCase(),],
						variant: 'success'
					});
					this.dispatchEvent(event);
				} else {
					this.isRelatedOptionEmpty = false;
					this.optionsSelectionModalOpen = true;
					this.modalPageOne = true;
					this.modalPageTwo = false;
				}
			}
		})
	}

	clearAll(event){
		this.treeGridLoading = true;
		this.treeGridData = [];
		this.selectedIdsMap = {};
		setTimeout(() => {this.treeGridLoading = false}, 300)
	}

	rowAction(event){
		const rec =  event.detail.row;
		console.log('REC: ', JSON.parse(JSON.stringify(rec)));
        const actionName = event.detail.action.name;
		if(actionName === 'Add'){
      if(rec.hasOwnProperty('disabled')){
				let errMessage;
				if(rec.disabled_info == DISABLED_OUT){
					console.log('DISABLED OUT')
					errMessage = 'This product is forbidden to be sold at the moment'
				} else if(rec.disabled_info == DISABLED_GEOGRAPHY){
					console.log('DISABLED GEOGRAPHY')
					errMessage = 'This product is not available for sale in your geography'
				}
				this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Info',
                        message: errMessage,
                        variant: 'info'
                    })
                );
			} else {
			this.currentProduct = rec;
			console.log('[sSGProductSelectorPageOne/rowAction] Action Add Started');
			this.getRelOptions(true);
      }

		} else if(actionName === 'Delete'){
			this.treeGridLoading = true;
			let found = false;
			let prod_index = 0;
			while(!found){
				let currProd = this.treeGridData[prod_index];
				console.log('currProd', currProd);
				if(currProd.Id == rec.Id){
					this.treeGridData.splice(prod_index,1);
					delete this.selectedIdsMap[rec.Id];
					found = true;
					console.log('FOUND')
					console.log(this.treeGridData);
				} else {
					let opt_index = 0;
					let options = this.treeGridData[prod_index]._children;
					while(!found && opt_index < options.length){
						if(options[opt_index].Id == rec.Id){
							this.treeGridData[prod_index]._children.splice(opt_index, 1);
							delete this.selectedIdsMap[rec.Id];
							found = true;
						}
						opt_index++;
					}
				}
				prod_index++;
			}
			setTimeout(() => {this.treeGridLoading = false}, 300)
		}
	}

	mobileRowAction(event){
		let recId = event.target.dataset.item;
		let i = 0;
		let found = false;
		while(i < this.productSelectionData.length && !found){
			if(this.productSelectionData[i].Id == recId){
				found = true;
				this.currentProduct = this.productSelectionData[i];
			}
			i++;
		}
		this.getRelOptions(true);
		//this.optionsSelectionModalOpen = true;
		//this.modalPageOne = true;
		//this.modalPageTwo = false;
	}

	clearProductFilters(){
		this.productNameCodeFilter = null;
		this.productStatusFilter = null;
		this.productBDFilter = null;
		this.productGTMOfferingFilter = null;
		this.productPartnerFilter = null;
		this.productNameCodeValue = 'null';
		this.productStatusValue = 'null';
		this.productBusinessDomainValue = 'null';
		this.productOfferGTM = 'null';
		this.productPartnerValue = 'null';
		this.getFilteredProducts();
	}

	clearOptionFilters(){
		this.optionNameCodeFilter = null;
		this.optionStatusFilter = null;
		this.optionOffertGTMFilter = null;
		this.optionBDFilter = null;
		this.optionBSubDFilter = null;
		this.optionNameCodeValue = 'null';
		this.optionStatusValue = 'null';
		this.optionOfferGTM = 'null';
		this.optionBusinessDomainValue = 'null';
		this.optionBusinessSubDomainValue = 'null';
		this.getRelOptions();
	}

	optionCheckboxChange(event){
		let rId = event.target.dataset.item;

		this.selectedOptionCheckboxes[rId] = !this.selectedOptionCheckboxes[rId];
		let currRec;

		if(this.selectedOptionCheckboxes[rId]){
			if(!this.mobileOptionsIdList.includes(rId)){
				this.optionSelectionData.forEach(option => {
					if(option.Id == rId){
						currRec = option;
					}
				})
				this.currentOptions = [...this.currentOptions, currRec];
				this.mobileOptionsIdList = [...this.mobileOptionsIdList, rId];
			}
		} else {
			let actualIndex;
			for (let i = 0; i < this.mobileOptionsIdList.length; i++) {
				if(this.mobileOptionsIdList[i] == rId){
					actualIndex = i;
				}
			}
			this.mobileOptionsIdList.splice(actualIndex);
			for(let i = 0; i < this.currentOptions.length; i++){
				if(this.currentOptions[i].Id == rId){
					actualIndex = i;
				}
			}
			this.currentOptions.splice(actualIndex);
		}
	}

	expandRows(){
		const grid = this.template.querySelector('lightning-tree-grid');
		grid.expandAll();
	}

	collapseRows(){
		const grid = this.template.querySelector('lightning-tree-grid');
		grid.collapseAll();
	}

	hideModalBox(){
		this.optionsSelectionModalOpen = false;
	}

	checkboxValueHandler(event){
		this.checkboxValue = event.detail.value;
	}

	pageOneOnClick(event){
		if(this.checkboxValue === 'yes'){ // go to select options
			this.modalPageOne = false;
			this.modalPageTwo = true;
			this.getRelOptions();

		} else if(this.checkboxValue === 'no'){ // go back
			this.hideModalBox();
			this.addToTreeGrid();
			const event = new ShowToastEvent({
				title: 'Product Selected',
				message: 'Product Selected with no options!',
				variant: 'success'
			});
			this.dispatchEvent(event);
		}


	}

	optionSelectedHandler(event){
    	this.selectedRows = event.detail.selectedRows.map(row => {
            let rtnRow;
            if(!this.optionsMap[row.Id].hasOwnProperty('disabled')){ // Implement your own code logic instead of this line
				rtnRow = row.id;
			}
            else{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Info',
                        message: 'This option is forbidden to be sold at the moment',
                        variant: 'info'
                    })
                );
            }
            return rtnRow;
        });

    	this.selectedRows = event.detail.selectedRows.filter(row => !this.optionsMap[row.Id].hasOwnProperty('disabled')).map(option => option.Id);
		event.detail.selectedRows.filter(row => !this.optionsMap[row.Id].hasOwnProperty('disabled')).forEach(elem => {
			let included = false;
			let i = 0;
			while(!included && i < this.currentOptions.length){
				if(elem.Id == this.currentOptions[i].Id){
					included = true;
				}
				i++;
			}
			if(!included){
				this.currentOptions = [...this.currentOptions, elem];
			}
		})
		//this.currentOptions = JSON.parse(JSON.stringify(event.detail.selectedRows));
	}

	addOptionsOnClick(event){
		this.hideModalBox();
		this.addToTreeGrid();
		this.hideModalBox();
	}

	addToTreeGrid(){
		let currProd = JSON.parse(JSON.stringify(this.currentProduct));
		let isUpdate = false;

		if(this.selectedIdsMap[currProd.Id] === undefined){
			console.log('[sSGProductSelectorPageOne/addToTreGrid] Adding new Product');

			currProd = {...currProd, _children: []};
			this.selectedIdsMap[currProd.Id] = currProd;
		} else {
			console.log('[sSGProductSelectorPageOne/addToTreGrid] Updating Product');

			isUpdate = true;
			this.treeGridData.forEach(product => {
				if(product.Id == currProd.Id){
					currProd = {...product};
				}
			})
		}

		if(this.currentOptions.length > 0){
			let optMap = {};
			currProd._children.forEach(option => {
				optMap[option.Id] = option;
			});
			this.currentOptions.forEach(option => {
				if(optMap[option.Id] === undefined){
					currProd._children = [...currProd._children, option];
				}
			})
		}else {
			if(!this.isRelatedOptionEmpty && this.checkboxValue === 'yes'){
				const event = new ShowToastEvent({
					title: 'Warning',
					message: 'You have not selected any option: only the product will be selected',
					variant: 'warning'
				});
				this.dispatchEvent(event);
			}
		}
		if(this.treeGridData.length > 0 && isUpdate){
			this.treeGridData = this.treeGridData.map(product => {
				if(product.Id == currProd.Id){
					return currProd;
				} else {
					return product;
				}
			});
		} else {
			this.treeGridData = [...this.treeGridData, currProd];
		}
		setTimeout(() => {console.log('ADDED'); const grid = this.template.querySelector('lightning-tree-grid');grid.expandAll();}, 300)
		console.log('[sSGProductSelectorPageOne/addToTreGrid] treeGridData: ', this.treeGridData);
		this.currentOptions = [];
		this.isRelatedOptionEmpty = false;

	}


	productStatusHandler(event){
		this.productStatusValue = event.detail.value;
		this.productStatusFilter = this.productStatusValue;
		this.getFilteredProducts();
	}

	productOfferGTMHandler(event){
		this.productOfferGTM = event.detail.value;
		this.productGTMOfferingFilter = this.productOfferGTM;
		this.getFilteredProducts();
	}

	productBusinessDomainHandler(event){
		this.productBusinessDomainValue = event.detail.value;
		this.productBDFilter = this.productBusinessDomainValue;
		this.getFilteredProducts();
	}

	productPartnerHandler(event){
		this.productPartnerValue = event.detail.value;
		this.productPartnerFilter = this.productPartnerValue;
		this.getFilteredProducts();
	}

	optionStatusHandler(event){
		this.optionStatusValue = event.detail.value;
		this.optionStatusFilter = this.optionStatusValue;
		this.getRelOptions();
	}

	optionOfferGTMHandler(event){
		this.optionOfferGTM = event.detail.value;
		this.optionOffertGTMFilter = this.optionOfferGTM;
		this.getRelOptions();
	}

	optionBusinessDomainHandler(event){
		this.optionBusinessDomainValue = event.detail.value;
		this.optionBDFilter = this.optionBusinessDomainValue;
		this.getRelOptions();
	}

	productNameCodeHandler(event){
		clearTimeout(this.typingTimer);
		let value = String(event.target.value);
        this.typingTimer = setTimeout(() => {
            if(value.length >= 3){
                this.productNameCodeValue = value;
				this.productNameCodeFilter = this.productNameCodeValue
            } else {
				this.productNameCodeValue = 'null';
				this.productNameCodeFilter = null;
			}
			this.getFilteredProducts();
        }, this.doneTypingInterval);
	}

	optionNameCodeHandler(event){
		clearTimeout(this.typingTimer);
		let value = String(event.target.value);
        this.typingTimer = setTimeout(() => {
            if(value.length >= 3){
                this.optionNameCodeValue = value;
				this.optionNameCodeFilter = this.optionNameCodeValue;
            } else {
				this.optionNameCodeValue = 'null';
				this.optionNameCodeFilter = null;
			}
			this.getRelOptions();
        }, this.doneTypingInterval);
	}

	optionBusinessSubDomainHandler(event){
		this.optionBusinessSubDomainValue = event.detail.value;
		this.optionBSubDFilter = this.optionBusinessSubDomainValue;
		this.getRelOptions();
	}

	deliveryModeConfirmationHandler(event){
		let recId = event.target.dataset.item;
		let delMode = event.detail.value;

		this.importList.forEach(lineItem => {
			if(lineItem.productId == recId){
				lineItem.deliveryMode = delMode;
			}
		});

		if(delMode == 'SaaS' || delMode == 'ASP'){
			let cevent = {
				target: {dataset: {item: recId}},
				detail: {value: 0}
			}
			this.licencePriceConfirmationHandler(cevent);
			this.annualMainteinanceConfirmationHandler(cevent);
			this.fullList.forEach(product => {
				if(product.Id == recId){
					product['zero'] = 0;
				}
			})
		}else{
			this.fullList.forEach(product => {
				if(product.Id == recId){
					product['zero'] = null;
				}
			})
		}

		this.checkImportOK();
	}

	licencePriceConfirmationHandler(event){
		let recId = event.target.dataset.item;
		let licPrice = event.detail.value;

		this.importList.forEach(lineItem => {
			if(lineItem.productId == recId){
				lineItem.licencePrice = licPrice;
			}
		});
		this.checkImportOK();
	}

	annualMainteinanceConfirmationHandler(event){
		let recId = event.target.dataset.item;
		let annMaint = event.detail.value;

		this.importList.forEach(lineItem => {
			if(lineItem.productId == recId){
				lineItem.annualMainteinance = annMaint;
			}
		});
		this.checkImportOK();
	}

	entryFeeConfirmationHandler(event){
		let recId = event.target.dataset.item;
		let entFee = event.detail.value;

		this.importList.forEach(lineItem => {
			if(lineItem.productId == recId){
				lineItem.entryFee = entFee;
			}
		});
		this.checkImportOK();
	}

	annualSubscriptionConfirmationHandler(event){
		let recId = event.target.dataset.item;
		let annSub = event.detail.value;

		this.importList.forEach(lineItem => {
			if(lineItem.productId == recId){
				lineItem.annualSubscription = annSub;
			}
		});
		this.checkImportOK();
	}

	quantityConfirmationHandler(event){
		let recId = event.target.dataset.item;
		let qty = event.detail.value;

		this.importList.forEach(lineItem => {
			if(lineItem.productId == recId){
				lineItem.quantity = qty;
			}
		});
		this.checkImportOK();
	}

	priceMetricsConfirmationHandler(event){
		let recId = event.target.dataset.item;
		let prcMet = event.detail.value;

		this.importList.forEach(lineItem => {
			if(lineItem.productId == recId){
				lineItem.priceMetrics = prcMet;
			}
		});
	}

	costConfirmationHandler(event){
		let recId = event.target.dataset.item;
		let cost = event.detail.value;

		this.importList.forEach(lineItem => {
			if(lineItem.productId == recId){
				lineItem.cost = cost;
			}
		});
		this.checkImportOK();
	}

	isPartner(id){

		let i = 0;
		let isPartnerProduct = false;
		while(!isPartnerProduct && i < this.fullList.length){
			console.log('-------------------')
			console.log(this.fullList)
			console.log(this.fullList[i].Id)
			console.log(id)
			console.log(this.fullList[i].Partner_Product__c)
			if(this.fullList[i].Id == id && this.fullList[i].Partner_Product__c){
				isPartnerProduct = true;
			}
			i++;
		}
		return isPartnerProduct;
	}

	checkImportOK(){
		let ok = true;
		let i = 0;

		console.log(this.importList);

		while (ok && i < this.importList.length) {
			if(
				!this.importList[i].hasOwnProperty('deliveryMode')  || (this.importList[i].hasOwnProperty('deliveryMode') && (this.importList[i].deliveryMode == '' || this.importList[i].deliveryMode == 'empty' || this.importList[i].deliveryMode == 'null')) ||
				this.importList[i].licencePrice == 'empty'       || this.importList[i].licencePrice == ''       ||
				this.importList[i].entryFee == 'empty'           || this.importList[i].entryFee == ''           ||
				this.importList[i].annualMainteinance == 'empty' || this.importList[i].annualMainteinance == '' ||
				this.importList[i].annualSubscription == 'empty' || this.importList[i].annualSubscription == '' ||
				((this.importList[i].cost == 'empty' || this.importList[i].cost == "") && this.isPartner(this.importList[i].productId))
			){
				ok = false;
			}
			i++;
		}

		if(ok){
			this.import_disabled = false;
		} else {
			this.import_disabled = true;
		}
	}

	async importData(){

		this.isLoading = true;
		let productsList = [];
		let deliveryModesList = [];
		let licencePriceList = [];
		let entryFeeList = [];
		let annualMainteinanceList = [];
		let annualSubscriptionList = [];
		let quantityList = [];
		let priceMetricList = [];
		let costList = [];

		// serialization
		this.importList.forEach(lineItem => {
			productsList = [...productsList, lineItem.productId];
			deliveryModesList = [...deliveryModesList, lineItem.deliveryMode];
			licencePriceList = [...licencePriceList, lineItem.licencePrice];
			entryFeeList = [...entryFeeList, lineItem.entryFee];
			annualMainteinanceList = [...annualMainteinanceList, lineItem.annualMainteinance];
			annualSubscriptionList = [...annualSubscriptionList, lineItem.annualSubscription];
			quantityList = lineItem.quantity ? [...quantityList, lineItem.quantity] : [...quantityList, 1];
			if(lineItem.priceMetrics == ''){ priceMetricList = [...priceMetricList, 'empty'];} else {priceMetricList = [...priceMetricList, lineItem.priceMetrics];}
			if(lineItem.cost == '') {costList = [...costList, 'empty'];} else {costList = [...costList, lineItem.cost];}
		})

		await importLineItem({
			contractId: this.RecordId,
			productList: productsList,
			deliveryModeList: deliveryModesList,
			licencePriceList: licencePriceList,
			entryFeeList: entryFeeList,
			annualMainteinanceList: annualMainteinanceList,
			annualSubscriptionList: annualSubscriptionList,
			quantityList: quantityList,
			priceMetricList: priceMetricList,
			costList: costList
		})
		.then(result => {
			console.log(result);
		})

		/*
		this.next_visible = true;
		this.back_visible = false;
		this.import_disabled = true;
		this.import_visible = false;
		this.treeGridData = [];
		*/
		this.isLoading = false;
		eval("$A.get('e.force:refreshView').fire();")
		this.navigateToRecordViewPage();
	}

	navigateToRecordViewPage() {

        this[NavigationMixin.Navigate]({

            type: 'standard__recordPage',

            attributes: {

                recordId: this.RecordId,

                objectApiName: 'Contract__c',

                actionName: 'view'

            }

        });

    }

	getHelp(event){
		helpModal.open();
	}
}