class Item < ActiveRecord::Base
  # ---
  # Attributes
  #  - shortdesc
  #  - longdesc
  #  - isdone
  #  - timestamps

  belongs_to :list

  def as_json(options=nil)
    super({
      :except => [:longdesc, :list_id]
    }.merge(options))
  end
end
