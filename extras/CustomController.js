import { Controller, GUI, injectStyles } from '../dist/lil-gui.esm.js';

/**
 * Extend this class to define a custom controller.
 * @template T
 */
export default class CustomController extends Controller {

	/**
	 * Register a custom controller. Adds its method to the GUI and inject its
	 * stylesheet into the page.
	 * @param {Function} CustomClass
	 */
	static register( CustomClass ) {

		const method = CustomClass.$method;

		// Add scope to each css declaration
		const CSS_SELECTOR = /(^|\}\s*?)([\S ]+?\s*?\{)/gm;
		const scoped = `$1.lil-gui .controller.${method} $2`;
		const style = CustomClass.$style.replace( CSS_SELECTOR, scoped );

		injectStyles( style );

		// Register creation method
		GUI.prototype[ method ] = function() {
			return new CustomClass( this, ...arguments );
		};

	}

	constructor( parent, object, property, ...args ) {

		super( parent, object, property, 'custom' );

		/**
		 * List of HTML elements passed to $prepareFormElement. Used in disable().
		 * @type {HTMLElement[]}
		 */
		this._formElements = [];

		/**
		 * Used for reset().
		 * @type {T}
		 */
		this._initialValue = this.save();

		// Used to scope styles to this controller
		this.domElement.classList.add( this.constructor.$method );

		this.$constructor( ...args );
		this.updateDisplay();

	}

	/**
	 * Called on controller creation. Receives all the parameters after
	 * gui.addXXX( object, property, ...
	 */
	$constructor() {}

	/**
	 * Should update the controller's widget to reflect a given value.
	 * @param {T} value
	 */
	// eslint-disable-next-line no-unused-vars
	$updateDisplay( value ) {}

	/**
	 * Should return a copy of `value`. You don't need to implement this method
	 * if you're targeting primitive values.
	 * @param {T} value
	 * @returns {T}
	 */
	$save( value ) {
		return value;
	}

	/**
	 * Should copy all relevant properties from `target` to `source`. You don't
	 * need to implement this method if you're targeting primitive values.
	 * @param {T} target
	 * @param {T} source
	 */
	$load( target, source ) {
		this.setValue( source );
	}

	/**
	 * Call this method on any HTML form element before adding it to `$widget`.
	 * @param {HTMLElement} el An HTML form element used in this controller's widget.
	 * @param {string} [name] Use this value when a widget has multiple form
	 * elements in order to distinguish them to assistive technologies.
	 */
	$prepareFormElement( el, name ) {

		// Collect for disable()
		this._formElements.push( el );

		if ( name ) {
			this.domElement.setAttribute( 'aria-labelledby', this.$name.id );
			el.setAttribute( 'aria-label', name );
		} else {
			el.setAttribute( 'aria-labelledby', this.$name.id );
		}

	}

	/**
	 * Call this function after modifying the result of `getValue()`. Only controllers
	 * that target objects need to call this method.
	 */
	$onModifyValue() {
		this._callOnChange();
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
		this.$load( this.getValue(), saved );
		this.$onModifyValue();
		this.$onFinishChange();
		return this;
	}

	reset() {
		return this.load( this._initialValue );
	}

}
