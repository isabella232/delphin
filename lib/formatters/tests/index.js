jest.disableAutomock();

// Internal dependencies
import { camelizeKeys, snakeifyKeys } from '..';

describe( 'snakeifyKeys', () => {
	it( "should convert all of an object's keys to snake_case", () => {
		expect( snakeifyKeys( { fooBar: 1, 'bar-baz': 2, foo3: { foo4Bar: true } } ) ).toEqual( {
			foo_bar: 1,
			bar_baz: 2,
			foo_3: {
				foo_4_bar: true
			}
		} );
	} );
} );

describe( 'camelizeKeys', () => {
	it( "should convert all of an object's keys to camelCase", () => {
		expect( camelizeKeys( { foo_bar: 1, 'bar-baz': 2, foo3: { foo4Bar: true } } ) ).toEqual( {
			fooBar: 1,
			barBaz: 2,
			foo3: {
				foo4Bar: true
			}
		} );
	} );
} );