import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getOptyInfo from '@salesforce/apex/SSG_OptyRecordPageController.getOptyInfo';

export default class SSG_OptyRecordPageController extends LightningElement {

	@api recordId;

	async connectedCallback(){
		let info = await this.getInfo();

		if(!info.hasOwnProperty('BU__c')){
			this.showPopup(
				'Warning!',
				'Please fill in the agency. You can preset your agency in your advanced user settings',
				'warning'
			)
		}

		if(!info.hasOwnProperty('Country__c')){
			this.showPopup(
				'Warning!',
				'Deployment Country is empty!',
				'warning'
			)
		}

	}

	getInfo(){
		return getOptyInfo({Id: this.recordId});

	}

	showPopup(title, message, variant){
		this.dispatchEvent(
			new ShowToastEvent({
				title: title,
				message: message,
				variant: variant
			})
		)
	}

}