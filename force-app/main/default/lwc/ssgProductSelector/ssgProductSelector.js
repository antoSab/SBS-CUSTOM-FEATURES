/**
 * @description       : Custom Selector For Products
 * @author            : Antonio Sabatino
 * @group             : Sopra Steria Group
 * @last modified on  : 02-10-2023
 * @last modified by  : Antonio Sabatino
**/
import { LightningElement } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';
import DESKTOP_TEMPLATE from './desktopTemplate';
import PHONE_TEMPLATE from './phoneTemplate';

export default class SsgProductSelector extends LightningElement {

	/* GETTERS AND SETTERS */
	get isDesktop() {return FORM_FACTOR === 'Large' || FORM_FACTOR === 'Medium' ? true : false;}

	/* STANDARD FUNCTIONS */
	render(){return this.isDesktop ? DESKTOP_TEMPLATE : PHONE_TEMPLATE;}

}