import HelloWorld from '../HelloWorld';

describe('HelloWorld Component', () => {
    test('renders correctly', () => {
        const component = shallow(<HelloWorld />);
        expect(component).toMatchSnapshot();
    });

    test('displays the correct text', () => {
        const component = shallow(<HelloWorld />);
        expect(component.text()).toBe('Hello, World!');
    });
});