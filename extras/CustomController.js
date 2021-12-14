import { Controller, GUI, injectStyles } from '../dist/lil-gui.esm.js';

/**
 * @template T
 */
export default class CustomController extends Controller {

	/**
	 * todo
	 * @param {Function} CustomClass
	 */
	static register( CustomClass ) {

		const method = CustomClass.$method;

		// Add scope to each css declaration
		const CSS_SELECTOR = /(?<=^|\}\s*)([ \S]+?)(?=\s*\{)/gm;
		const scoped = `.lil-gui .controller.custom.${method} $1`;
		const style = CustomClass.$style.replace( CSS_SELECTOR, scoped );

		injectStyles( style );

		// Register creation method
		GUI.prototype[ method ] = function() {
			return new CustomClass( this, ...arguments );
		};

	}

	constructor( parent, object, property, ...args ) {

		super( parent, object, property, 'custom' );

		this.domElement.classList.add( this.constructor.$method );

		/**
		 * List of HTML elements to disable.
		 * @type {HTMLElement[]}
		 */
		this._formElements = [];

		this.$constructor( ...args );

		/**
		 * @type {T}
		 */
		this._initialValue = this.save();

		this.updateDisplay();

	}

	/**
	 * todo
	 */
	$constructor() {}

	/**
	 * todo
	 * @param {T} value
	 */
	// eslint-disable-next-line no-unused-vars
	$updateDisplay( value ) {}

	/**
	 * todo
	 * @param {T} value todo
	 * @returns {T}
	 */
	$save( value ) {
		return value;
	}

	/**
	 * todo
	 * @param {T} target
	 * @param {T} source
	 */
	$load( target, source ) {
		this.setValue( source );
	}

	/**
	 * Call this method on any HTML form element before adding it to the controller's $widget.
	 * @param {HTMLElement} el An HTML form element used in this controller's widget.
	 * @param {string} [name] Use this value when a widget has multiple form elements, in order
	 * to distinguish them for assistive technologies.
	 */
	$prepareFormElement( el, name ) {

		// Collect for disable()
		this._formElements.push( el );

		if ( name ) {
			el.setAttribute( 'aria-label', name );
		} else {
			el.setAttribute( 'aria-labelledby', this.$name.id );
		}

	}

	/**
	 * todo
	 * @param {function(T)} setter
	 * @param {boolean} [isFinal]
	 */
	$modifyValue( setter, isFinal = false ) {

		setter( this.getValue() );

		this._callOnChange();
		if ( isFinal ) this._callOnFinishChange();

		this.updateDisplay();

	}

	$onFinishChange() {
		this._callOnFinishChange();
	}

	disable( disabled ) {
		super.disable( disabled );
		this._formElements.forEach( el => el.toggleAttribute( 'disabled', disabled ) );
		return this;
	}

	updateDisplay() {
		this.$updateDisplay( this.getValue() );
		return this;
	}

	save() {
		return this.$save( this.getValue() );
	}

	load( saved ) {
		this.$modifyValue( value => this.$load( value, saved ), true );
		return this;
	}

	reset() {
		return this.load( this._initialValue );
	}

}
