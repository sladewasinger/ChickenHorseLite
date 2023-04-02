export class NameForm {
    private form: HTMLFormElement;

    constructor(private formSubmitted: (value: string) => void) {
        this.form = document.getElementById('name-form') as HTMLFormElement;
        if (!this.form) {
            throw new Error('Form not found');
        }

        this.hide();

        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.submit();
        });
    }

    private submit(): void {
        const input = this.form.querySelector('input') as HTMLInputElement;
        if (!input) {
            throw new Error('Input not found');
        }

        const value = input.value;
        if (value) {
            this.formSubmitted(value);
            this.hide();
        }
    }

    public hide(): void {
        this.form.style.display = 'none';
    }

    public show(): void {
        this.form.style.display = 'block';
    }
}
