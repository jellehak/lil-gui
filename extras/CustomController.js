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

		const id = CustomClass.$id;

		// Add scope to each css declaration
		const CSS_SELECTOR = /(^|\}\s*?)([\S ]+?\s*?\{)/gm;
		const scoped = `$1.lil-gui .controller.${id} $2`;
		const style = CustomClass.$style.replace( CSS_SELECTOR, scoped );

		injectStyles( style );

		// Register creation method
		GUI.prototype[ 'add' + id ] = function() {
			return new CustomClass( this, ...arguments );
		};

	}

	constructor( parent, object, property, ...args ) {

		super( parent, object, property, 'custom' );

		// Used to scope styles to this controller
		this.domElement.classList.add( this.constructor.$id );

		this.$constructor( ...args );

		// Used for reset().
		this._initialValue = this.save();

		this._toDisable = [];

		// Makes form elements disable-able and gives them aria labels.
		this._prepareFormElements();

		this.updateDisplay();

	}

	/**
	 * The value targeted by this controller.
	 * @returns {T}
	 */
	get value() {
		return this.getValue();
	}

	/**
	 * Assigning this property will update the display and fire change events.
	 */
	set value( value ) {
		this.setValue( value );
	}

	/**
	 * Called on controller creation. Receives all the parameters after
	 * gui.addXXX( object, property, ...
	 * @param {...any} args
	 */
	// eslint-disable-next-line no-unused-vars
	$constructor( ...args ) {}

	/**
	 * Should update the controller's widget to reflect the current value.
	 */
	$updateDisplay() {}

	/**
	 * Should return a copy of `this.getValue()`. You don't need to implement this method
	 * if you're targeting primitive values.
	 * @returns {T}
	 */
	$save() {
		return this.getValue();
	}

	/**
	 * Should copy all relevant properties from `target` to `this.getValue()`. You don't
	 * need to implement this method if you're targeting primitive values.
	 * @param {T} source
	 */
	$load( source ) {
		this.setValue( source );
		this.value;
	}

	/**
	 * Call this method after modifying the result of `getValue()`. Only controllers
	 * that target objects need to call this method.
	 */
	$onModifyValue() {
		this._callOnChange();
		this.updateDisplay();
	}

	/**
	 * Call this method after your controller loses focus.
	 */
	$onFinishChange() {
		this._callOnFinishChange();
	}

	_prepareFormElements() {

		const SELECTORS = [
			'*[tabindex]',
			'input',
			'label',
			'select',
			'textarea',
			'button',
			'fieldset',
			'legend',
			'datalist',
			'output',
			'option',
			'optgroup'
		];

		const elements = this.$widget.querySelectorAll( SELECTORS.join( ',' ) );

		Array.from( elements ).forEach( el => {

			this._toDisable.push( el );

			if ( !el.hasAttribute( 'aria-label' ) && !el.hasAttribute( 'aria-labelledby' ) ) {
				el.setAttribute( 'aria-labelledby', this.$name.id );
			}

		} );

	}

	disable( disabled ) {
		super.disable( disabled );
		this._toDisable.forEach( el => el.toggleAttribute( 'disabled', disabled ) );
		return this;
	}

	updateDisplay() {
		this.$updateDisplay();
		return this;
	}

	save() {
		return this.$save();
	}

	load( saved ) {
		this.$load( saved );
		this.$onModifyValue();
		this.$onFinishChange();
		return this;
	}

	reset() {
		return this.load( this._initialValue );
	}

}
