import Controller from './Controller.js';

export default class NumberController extends Controller {

	constructor( parent, object, property, min, max, step ) {

		super( parent, object, property, 'number' );

		this._createInput();

		this.min( min );
		this.max( max );

		const stepExplicit = step !== undefined;
		this.step( stepExplicit ? step : this._getImplicitStep(), stepExplicit );

		this.updateDisplay();

	}

	updateDisplay() {

		const value = this.getValue();

		if ( this.__hasSlider ) {
			const percent = ( value - this.__min ) / ( this.__max - this.__min );
			this.$fill.style.setProperty( 'width', percent * 100 + '%' );
		}

		if ( !this.__inputFocused ) {
			this.$input.value = value;
		}

	}

	_createInput() {

		this.$input = document.createElement( 'input' );
		this.$input.setAttribute( 'type', 'text' );
		this.$input.setAttribute( 'inputmode', 'numeric' );

		this.$widget.appendChild( this.$input );

		this.$input.addEventListener( 'focus', () => {
			this.__inputFocused = true;
		} );

		this.$input.addEventListener( 'input', () => {

			// Test if the string is a valid number
			let value = parseFloat( this.$input.value );
			if ( isNaN( value ) ) return;

			// Input boxes clamp to max and min if they're defined, but they
			// don't snap to step, so you can be as precise as you want.
			value = this._clamp( value );

			// Set the value, but don't call onFinishedChange
			this.setValue( value, false );

		} );

		this.$input.addEventListener( 'blur', () => {
			this.__inputFocused = false;
			this._callOnFinishedChange();
			this.updateDisplay();
		} );


		this.$input.addEventListener( 'keydown', e => {
			if ( e.keyCode === 13 ) {
				this.$input.blur();
			}
			if ( e.keyCode === 38 ) {
				e.preventDefault();
				increment( this.__step * ( e.shiftKey ? 100 : 10 ) );
			}
			if ( e.keyCode === 40 ) {
				e.preventDefault();
				increment( -1 * this.__step * ( e.shiftKey ? 100 : 10 ) );
			}
		} );

		const increment = delta => {
			let value = parseFloat( this.$input.value );
			if ( isNaN( value ) ) return;
			value += delta;
			value = this._snap( value );
			value = this._clamp( value );
			this.setValue( value, false );
			// Manually update the input display because it's focused ><
			this.$input.value = this.getValue();
		};

		const onMouseWheel = e => {
			e.preventDefault();
			increment( ( e.deltaX + -e.deltaY ) * this.__step );
		};

		this.$input.addEventListener( 'wheel', onMouseWheel, { passive: false } );

	}

	_createSlider() {

		this.__hasSlider = true;

		this.$slider = document.createElement( 'div' );
		this.$slider.classList.add( 'slider' );

		this.$fill = document.createElement( 'div' );
		this.$fill.classList.add( 'fill' );

		this.$slider.appendChild( this.$fill );
		this.$widget.insertBefore( this.$slider, this.$input );

		this.domElement.classList.add( 'hasSlider' );

		const map = ( v, a, b, c, d ) => {
			return ( v - a ) / ( b - a ) * ( d - c ) + c;
		};

		const setValueFromX = clientX => {
			const rect = this.$slider.getBoundingClientRect();
			let value = map( clientX, rect.left, rect.right, this.__min, this.__max );
			value = this._snap( value );
			value = this._clamp( value );
			this.setValue( value, false );
		};

		// Bind mouse listeners

		this.$slider.addEventListener( 'mousedown', e => {
			setValueFromX( e.clientX );
			this.$slider.classList.add( 'active' );
			window.addEventListener( 'mousemove', mouseMove );
			window.addEventListener( 'mouseup', mouseUp );
		} );

		const mouseMove = e => {
			setValueFromX( e.clientX );
		};

		const mouseUp = () => {
			this._callOnFinishedChange();
			this.$slider.classList.remove( 'active' );
			window.removeEventListener( 'mousemove', mouseMove );
			window.removeEventListener( 'mouseup', mouseUp );
		};

		// Bind touch listeners

		let testingForScroll = false, prevClientX, prevClientY;

		this.$slider.addEventListener( 'touchstart', e => {

			if ( e.touches.length > 1 ) return;

			// For the record, as of 2019, Android seems to take care of this
			// automatically. I'd like to remove this whole test if iOS ever 
			// decided to do the same.

			const root = this.parent.root.$children;
			const scrollbarPresent = root.scrollHeight > root.clientHeight;

			if ( !scrollbarPresent ) {

				// If we're not in a scrollable container, we can set the value
				// straight away on touchstart.
				setValueFromX( e.touches[ 0 ].clientX );
				this.$slider.classList.add( 'active' );
				testingForScroll = false;

			} else {

				// Otherwise, we should wait for a for the first touchmove to
				// see if the user is trying to move horizontally or vertically.
				prevClientX = e.touches[ 0 ].clientX;
				prevClientY = e.touches[ 0 ].clientY;
				testingForScroll = true;

			}

			window.addEventListener( 'touchmove', touchMove, { passive: false } );
			window.addEventListener( 'touchend', touchEnd );

		} );

		const touchMove = e => {

			if ( !testingForScroll ) {

				e.preventDefault();
				setValueFromX( e.touches[ 0 ].clientX );

			} else {

				const dx = e.touches[ 0 ].clientX - prevClientX;
				const dy = e.touches[ 0 ].clientY - prevClientY;

				if ( Math.abs( dx ) > Math.abs( dy ) ) {

					// We moved horizontally, set the value and stop checking.
					setValueFromX( e.touches[ 0 ].clientX );
					this.$slider.classList.add( 'active' );
					testingForScroll = false;

				} else {

					// This was, in fact, an attempt to scroll. Abort.
					window.removeEventListener( 'touchmove', touchMove );
					window.removeEventListener( 'touchend', touchEnd );

				}

			}

		};

		const touchEnd = () => {
			this._callOnFinishedChange();
			this.$slider.classList.remove( 'active' );
			window.removeEventListener( 'touchmove', touchMove );
			window.removeEventListener( 'touchend', touchEnd );
		};

		const increment = delta => {
			let value = this.getValue();
			value += delta;
			value = this._snap( value );
			value = this._clamp( value );
			this.setValue( value, false );
		};

		const onMouseWheel = e => {
			e.preventDefault();
			increment( ( e.deltaX + -e.deltaY ) * ( this.__max - this.__min ) / 1000 );
		};

		this.$slider.addEventListener( 'wheel', onMouseWheel, { passive: false } );

	}

	min( min ) {
		this.__min = min;
		this._onUpdateMinMax();
		return this;
	}

	max( max ) {
		this.__max = max;
		this._onUpdateMinMax();
		return this;
	}

	step( step, explicit = true ) {
		this.__step = step;
		this.__stepExplicit = explicit;
		return this;
	}

	_getImplicitStep() {

		if ( this._hasMin() && this._hasMax() ) {
			return ( this.__max - this.__min ) / 1000;
		}

		return 0.1;

	}

	_onUpdateMinMax() {

		if ( !this.__hasSlider && this._hasMin() && this._hasMax() ) {

			// If this is the first time we're hearing about min and max
			// and we haven't explicitly stated what our step is, let's
			// update that too.
			if ( !this.__stepExplicit ) {
				this.step( this._getImplicitStep(), false );
			}

			this._createSlider();
			this.updateDisplay();

		}

	}

	_hasMin() {
		return this.__min !== undefined;
	}

	_hasMax() {
		return this.__max !== undefined;
	}

	_snap( value ) {

		// // This would be the logical way to do things, but floating point errors.
		// return Math.round( value / this.__step ) * this.__step;

		// // The inverse step strategy solves most floating point precision issues,
		// // but not all of them ... 
		// const inverseStep = 1 / this.__step;
		// return Math.round( value * inverseStep ) / inverseStep;

		// This makes me nauseous, but... works?
		const r = Math.round( value / this.__step ) * this.__step;
		return parseFloat( r.toPrecision( 15 ) );

	}

	_clamp( value ) {
		const min = this._hasMin() ? this.__min : -Infinity;
		const max = this._hasMax() ? this.__max : Infinity;
		return Math.max( min, Math.min( max, value ) );
	}

}