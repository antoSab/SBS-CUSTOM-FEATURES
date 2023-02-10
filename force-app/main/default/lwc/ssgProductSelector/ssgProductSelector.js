/**
 * @description       : Custom Selector For Products
 * @author            : Antonio Sabatino
 * @group             : Sopra Steria Group
 * @last modified on  : 02-10-2023
 * @last modified by  : Antonio Sabatino
**/
import { LightningElement, track, api, wire } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';
import DESKTOP_TEMPLATE from './desktopTemplate';
import PHONE_TEMPLATE from './phoneTemplate';

export default class SsgProductSelector extends LightningElement {

	_objectSettings = {};
	_isFirstPage = false;

	@track status;

	/* GETTERS AND SETTERS */
	get isDesktop() {return FORM_FACTOR === 'Large' || FORM_FACTOR === 'Medium' ? true : false;}
	get isSelecting() {return this._isFirstPage;}

	/* STANDARD FUNCTIONS */
	render(){return this.isDesktop ? DESKTOP_TEMPLATE : PHONE_TEMPLATE;}

	connectedCallback(){
		this._isFirstPage = true;
	}

}