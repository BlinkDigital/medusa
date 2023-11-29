import {NestedForm} from '../../../../../utils/nested-form'
import {VariantGeneralFormType} from '../variant-general-form'
import {Controller} from 'react-hook-form'
import PriceFormInput from '../../../general/prices-form/price-form-input'


type Props = {
    form: NestedForm<VariantGeneralFormType>
}

const VariantPlatformCostsForm = ({form}: Props) => {
    const {control, path} = form;

    return (
        <Controller control={control}
                    name={path('')}
                    render={({field: {onChange, value, name, ref}, fieldState, formState}) => (
                        <PriceFormInput amount={value}
                                        name={name}
                                        label="Platform costs"
                                        onChange={onChange}
                                        currencyCode='EUR'/>
                    )}
        ></Controller>
    )
}

export default VariantPlatformCostsForm;